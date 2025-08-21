import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { formatEuro, parseDate } from '@/app/utils/helper';
import { ExpenseStatus, getExpenseStatusTranslation } from '@/app/enums/ExpenseStatus';
import { config } from '@/app/config';

export const generateExpenseReportPDF = (report: ExpenseReport) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // En-tête avec logo
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(config.CLUB_NAME, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('NOTE DE FRAIS', pageWidth / 2, 30, { align: 'center' });
  
  // Badge de statut
  const statusText = getExpenseStatusTranslation(report.status as ExpenseStatus);
  const statusColor = report.status === ExpenseStatus.APPROVED ? [0, 128, 0] : 
                      report.status === ExpenseStatus.ACCOUNTED ? [128, 0, 128] : [0, 0, 0];
  
  doc.setFontSize(14);
  doc.setTextColor(...statusColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`STATUT: ${statusText.toUpperCase()}`, pageWidth / 2, 40, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  // Informations générales
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS GÉNÉRALES', 14, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const generalInfo = [
    ['Demandeur:', `${report.user?.firstname || ''} ${report.user?.lastname || ''}`.trim() || 'N/A'],
    ['Événement:', report.event?.titre || 'N/A'],
    ['Commission:', report.event?.commission?.title || 'N/A'],
    ['Code événement:', report.event?.code || 'N/A'],
    ['Date événement:', parseDate(report.event?.tsp)],
    ['Date fin événement:', parseDate(report.event?.tspEnd)],
    ['Lieu de RDV:', report.event?.rdv || 'N/A'],
    ['Participants:', report.event?.participationsCount?.toString() || 'N/A'],
    ['Date de soumission:', parseDate(report.createdAt)],
    ['Type de demande:', report.refundRequired ? 'Remboursement' : 'Don au club'],
  ];
  
  let yPosition = 65;
  generalInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(String(label || ''), 14, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value || ''), 60, yPosition);
    yPosition += 7;
  });
  
  // Commentaire de statut (si rejeté)
  if (report.status === ExpenseStatus.REJECTED && report.statusComment) {
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Motif du rejet:', 14, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(report.statusComment || ''), 60, yPosition);
    yPosition += 10;
  }
  
  // Détails des frais - Transport
  if (report.details?.transport) {
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FRAIS DE TRANSPORT', 14, yPosition);
    yPosition += 10;
    
    const transport = report.details.transport;
    const transportData = [];
    
    // Adapter selon le type de transport
    if (transport.type === 'PERSONAL_VEHICLE') {
      transportData.push(['Type', 'Véhicule personnel']);
      if (transport.distance) transportData.push(['Distance', `${transport.distance} km`]);
      if (transport.tollFee) transportData.push(['Péage', formatEuro(transport.tollFee)]);
      if (transport.remboursableAmount) {
        transportData.push(['Montant remboursable', formatEuro(transport.remboursableAmount)]);
      }
    } else if (transport.type === 'PUBLIC_TRANSPORT') {
      transportData.push(['Type', 'Transport en commun']);
      if (transport.ticketPrice) transportData.push(['Prix du billet', formatEuro(transport.ticketPrice)]);
      if (transport.remboursableAmount) {
        transportData.push(['Montant remboursable', formatEuro(transport.remboursableAmount)]);
      }
    } else if (transport.type === 'CLUB_MINIBUS') {
      transportData.push(['Type', 'Minibus du club']);
      if (transport.distance) transportData.push(['Distance', `${transport.distance} km`]);
      if (transport.fuelExpense) transportData.push(['Carburant', formatEuro(transport.fuelExpense)]);
      if (transport.tollFee) transportData.push(['Péage', formatEuro(transport.tollFee)]);
      if (transport.passengerCount) transportData.push(['Nombre de passagers', transport.passengerCount.toString()]);
      if (transport.remboursableAmount) {
        transportData.push(['Montant remboursable', formatEuro(transport.remboursableAmount)]);
      }
    } else if (transport.type === 'RENTAL_MINIBUS') {
      transportData.push(['Type', 'Location de minibus']);
      if (transport.rentalPrice) transportData.push(['Prix de location', formatEuro(transport.rentalPrice)]);
      if (transport.fuelExpense) transportData.push(['Carburant', formatEuro(transport.fuelExpense)]);
      if (transport.tollFee) transportData.push(['Péage', formatEuro(transport.tollFee)]);
      if (transport.passengerCount) transportData.push(['Nombre de passagers', transport.passengerCount.toString()]);
      if (transport.remboursableAmount) {
        transportData.push(['Montant remboursable', formatEuro(transport.remboursableAmount)]);
      }
    }
    
    autoTable(doc, {
      body: transportData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 14, right: 14 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Détails des frais - Hébergement
  if (report.details?.accommodations && report.details.accommodations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FRAIS D\'HÉBERGEMENT', 14, yPosition);
    yPosition += 10;
    
    const accommodationData = report.details.accommodations.map(a => [
      a.type || 'Hébergement',
      a.description || '',
      `${a.nightsCount || 0} nuit${(a.nightsCount || 0) > 1 ? 's' : ''}`,
      formatEuro(a.pricePerNight || 0),
      formatEuro(a.totalPrice || a.price || 0),
      // Utiliser directement remboursableAmount de l'API
      formatEuro(a.remboursableAmount || 0)
    ]);
    
    autoTable(doc, {
      head: [['Type', 'Description', 'Nuits', 'Prix/nuit', 'Total', 'Remboursable']],
      body: accommodationData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 14, right: 14 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Détails des frais - Autres
  if (report.details?.others && report.details.others.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('AUTRES FRAIS', 14, yPosition);
    yPosition += 10;
    
    const othersData = report.details.others.map(o => [
      o.type || 'Autre',
      o.description || '',
      formatEuro(o.price || 0),
      // Utiliser directement remboursableAmount de l'API
      formatEuro(o.remboursableAmount || o.price || 0)
    ]);
    
    autoTable(doc, {
      head: [['Type', 'Description', 'Prix', 'Remboursable']],
      body: othersData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 14, right: 14 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Totaux
  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RÉCAPITULATIF', 14, yPosition);
  yPosition += 10;
  
  // Calculer les totaux depuis les données de l'API
  let totalRemboursable = 0;
  
  // Transport
  if (report.details?.transport?.remboursableAmount) {
    totalRemboursable += report.details.transport.remboursableAmount;
  }
  
  // Hébergements
  if (report.details?.accommodations) {
    report.details.accommodations.forEach(a => {
      totalRemboursable += (a.remboursableAmount || 0);
    });
  }
  
  // Autres
  if (report.details?.others) {
    report.details.others.forEach(o => {
      totalRemboursable += (o.remboursableAmount || o.price || 0);
    });
  }
  
  const summaryData = [
    ['Total remboursable', formatEuro(totalRemboursable)],
    ['Type de demande', report.refundRequired ? 'Remboursement' : 'Don au club'],
  ];
  
  autoTable(doc, {
    body: summaryData,
    startY: yPosition,
    theme: 'plain',
    styles: { fontSize: 11 },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'right' },
      1: { halign: 'left' },
    },
    margin: { left: 80, right: 14 },
  });
  
  // Pied de page
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Nom du fichier
  const fileName = `note-de-frais-${report.event.code || report.event.id || 'document'}-${report.user.lastname || 'export'}.pdf`;
  
  // Téléchargement
  doc.save(fileName);
};
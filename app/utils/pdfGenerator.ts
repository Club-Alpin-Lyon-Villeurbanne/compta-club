import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { calculateTotals, formatEuro } from '@/app/utils/helper';
import { ExpenseStatus, getExpenseStatusTranslation } from '@/app/enums/ExpenseStatus';
import { config } from '@/app/config';

export const generateExpenseReportPDF = (report: ExpenseReport) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const totals = calculateTotals(report.details);
  
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
    ['Demandeur:', `${report.user.firstname} ${report.user.lastname}`],
    ['Événement:', report.event.titre],
    ['Commission:', report.event.commission.name],
    ['Code événement:', report.event.code || 'N/A'],
    ['Date événement:', new Date(report.event.tsp).toLocaleDateString('fr-FR')],
    ['Date fin événement:', new Date(report.event.tspEnd).toLocaleDateString('fr-FR')],
    ['Lieu de RDV:', report.event.rdv || 'N/A'],
    ['Participants:', report.event.participationsCount?.toString() || 'N/A'],
    ['Date de soumission:', new Date(report.createdAt).toLocaleDateString('fr-FR')],
    ['Type de demande:', report.refundRequired ? 'Remboursement' : 'Don au club'],
  ];
  
  let yPosition = 65;
  generalInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, yPosition);
    yPosition += 7;
  });
  
  // Commentaire de statut (si rejeté)
  if (report.status === ExpenseStatus.REJECTED && report.statusComment) {
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Motif du rejet:', 14, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(report.statusComment, 60, yPosition);
    yPosition += 10;
  }
  
  // Détails des frais - Transport
  if (report.details.transport && report.details.transport.length > 0) {
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FRAIS DE TRANSPORT', 14, yPosition);
    yPosition += 10;
    
    const transportData = report.details.transport.map(t => [
      t.type || '',
      t.description || '',
      formatEuro(t.price || 0),
      formatEuro(t.ticketPrice || 0),
      formatEuro(t.totalKm || 0) + ' km',
      formatEuro(t.remboursableAmount || 0)
    ]);
    
    autoTable(doc, {
      head: [['Type', 'Description', 'Prix', 'Billet', 'Km', 'Remboursable']],
      body: transportData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 14, right: 14 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Détails des frais - Hébergement
  if (report.details.accommodations && report.details.accommodations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FRAIS D\'HÉBERGEMENT', 14, yPosition);
    yPosition += 10;
    
    const accommodationData = report.details.accommodations.map(a => [
      a.type || '',
      a.description || '',
      formatEuro(a.nightsCount || 0) + ' nuits',
      formatEuro(a.pricePerNight || 0),
      formatEuro(a.totalPrice || 0),
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
  if (report.details.others && report.details.others.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('AUTRES FRAIS', 14, yPosition);
    yPosition += 10;
    
    const othersData = report.details.others.map(o => [
      o.type || '',
      o.description || '',
      formatEuro(o.price || 0),
      formatEuro(o.remboursableAmount || 0)
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
  
  const summaryData = [
    ['Total des frais', formatEuro(totals.totalPrice)],
    ['Total remboursable', formatEuro(totals.totalRemboursable)],
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
  const fileName = `note-de-frais-${report.event.code || report.event.id}-${report.user.lastname}.pdf`;
  
  // Téléchargement
  doc.save(fileName);
};
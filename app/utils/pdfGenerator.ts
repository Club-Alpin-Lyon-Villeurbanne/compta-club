import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExpenseReport } from '@/app/interfaces/noteDeFraisInterface';
import { calculateTotals, formatEuro } from '@/app/utils/helper';
import { ExpenseStatus, getExpenseStatusTranslation } from '@/app/enums/ExpenseStatus';
import { config } from '@/app/config';

export const generateExpenseReportPDF = (report: ExpenseReport) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Parser les details si c'est une chaîne JSON
  const details = typeof report.details === 'string' 
    ? JSON.parse(report.details) 
    : report.details;
  
  const totals = calculateTotals(details);
  
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
  
  // Organisation des informations sur 2 colonnes
  const columnWidth = (pageWidth - 28) / 2; // Largeur de chaque colonne
  const col1X = 14; // Position X de la colonne 1
  const col2X = col1X + columnWidth; // Position X de la colonne 2
  const labelOffset = 40; // Offset pour les valeurs par rapport aux labels
  
  const generalInfoCol1 = [
    ['Demandeur:', `${report.utilisateur.prenom} ${report.utilisateur.nom}`],
    ['Événement:', report.sortie.titre],
    ['Commission:', report.sortie.commission.name],
    ['Code événement:', report.sortie.code || 'N/A'],
    ['Lieu de RDV:', report.sortie.lieuRendezVous || 'N/A'],
  ];
  
  const generalInfoCol2 = [
    ['Date début:', report.sortie.dateDebut ? new Date(report.sortie.dateDebut).toLocaleDateString('fr-FR') : 'N/A'],
    ['Date fin:', report.sortie.dateFin ? new Date(report.sortie.dateFin).toLocaleDateString('fr-FR') : 'N/A'],
    ['Participants:', report.sortie.participationsCount?.toString() || 'N/A'],
    ['Date soumission:', report.dateCreation ? new Date(report.dateCreation).toLocaleDateString('fr-FR') : 'N/A'],
    ['Type de demande:', report.refundRequired ? 'Remboursement' : 'Don au club'],
  ];
  
  let yPosition = 65;
  
  // Afficher colonne 1
  generalInfoCol1.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label, col1X, yPosition);
    doc.setFont('helvetica', 'normal');
    // Tronquer le texte si trop long pour la colonne
    const maxWidth = columnWidth - labelOffset - 5;
    const text = String(value || 'N/A');
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines[0], col1X + labelOffset, yPosition);
    yPosition += 7;
  });
  
  yPosition = 65; // Réinitialiser pour la colonne 2
  
  // Afficher colonne 2
  generalInfoCol2.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label, col2X, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value || 'N/A'), col2X + labelOffset, yPosition);
    yPosition += 7;
  });
  
  // Ajuster yPosition pour la suite du document
  yPosition += 5;
  doc.setFontSize(10);
  
  // Commentaire de statut (si rejeté)
  if (report.status === ExpenseStatus.REJECTED && report.commentaireStatut) {
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Motif du rejet:', 14, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(report.commentaireStatut, 60, yPosition);
    yPosition += 10;
  }
  
  // Détails des frais - Transport
  if (details.transport) {
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FRAIS DE TRANSPORT', 14, yPosition);
    yPosition += 10;
    
    // Le transport est maintenant un objet unique, pas un tableau
    const t = details.transport;
    const transportType = t.type === 'PERSONAL_VEHICLE' ? 'Véhicule personnel' :
                         t.type === 'PUBLIC_TRANSPORT' ? 'Transport public' :
                         t.type === 'CLUB_MINIBUS' ? 'Minibus club' :
                         t.type === 'RENTAL_MINIBUS' ? 'Minibus location' : t.type;
    
    const transportData = [[
      transportType,
      t.distance ? `${t.distance} km` : '-',
      t.tollFee ? formatEuro(t.tollFee) : '-',
      t.ticketPrice ? formatEuro(t.ticketPrice) : '-',
      t.comment || '-'
    ]];
    
    autoTable(doc, {
      head: [['Type', 'Distance', 'Péages', 'Prix billet', 'Commentaire']],
      body: transportData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 14, right: 14 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Détails des frais - Hébergement
  if (details.accommodations && details.accommodations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FRAIS D\'HÉBERGEMENT', 14, yPosition);
    yPosition += 10;
    
    const accommodationData = details.accommodations.map(a => [
      a.comment || '-',
      formatEuro(a.price || 0)
    ]);
    
    autoTable(doc, {
      head: [['Description', 'Montant']],
      body: accommodationData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 14, right: 14 },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Détails des frais - Autres
  if (details.others && details.others.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('AUTRES FRAIS', 14, yPosition);
    yPosition += 10;
    
    const othersData = details.others.map(o => [
      o.comment || '-',
      formatEuro(o.price || 0)
    ]);
    
    autoTable(doc, {
      head: [['Description', 'Montant']],
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
  const fileName = `note-de-frais-${report.sortie.code || report.sortie.id}-${report.utilisateur.nom}.pdf`;
  
  // Téléchargement
  doc.save(fileName);
};
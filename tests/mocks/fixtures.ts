/**
 * Fixtures de donnees mockees pour les tests E2E
 */

export const mockUser = {
  id: 1,
  prenom: 'Jean',
  nom: 'Dupont',
  email: 'admin@clubalpinlyon.top',
};

export const mockCommission = {
  id: 1,
  title: 'Alpinisme',
  code: 'ALP',
};

export const mockEvent = {
  id: 101,
  commission: mockCommission,
  heureRendezVous: '2025-01-15T08:00:00',
  heureRetour: '2025-01-15T18:00:00',
  titre: 'Sortie Mont Blanc',
  code: 'SORTIE-2025-001',
  lieuRendezVous: 'Chamonix',
  participationsCount: 5,
  status: 1,
  statusLegal: 1,
};

export const mockDetails = {
  transport: {
    type: 'PERSONAL_VEHICLE',
    distance: 150,
    tollFee: 15,
  },
  accommodations: [
    { expenseId: '1', price: 80, comment: 'Refuge' },
  ],
  others: [
    { expenseId: '2', price: 25, comment: 'Repas' },
  ],
};

export const mockExpenseReports = [
  {
    id: 1,
    status: 'submitted',
    refundRequired: true,
    utilisateur: mockUser,
    sortie: mockEvent,
    dateCreation: '2025-01-10T10:00:00',
    commentaireStatut: null,
    details: mockDetails,
    piecesJointes: [],
  },
  {
    id: 2,
    status: 'approved',
    refundRequired: true,
    utilisateur: { id: 2, prenom: 'Marie', nom: 'Martin' },
    sortie: { ...mockEvent, id: 102, titre: 'Randonnee Vercors', code: 'SORTIE-2025-002' },
    dateCreation: '2025-01-08T14:30:00',
    commentaireStatut: null,
    details: {
      transport: { type: 'PUBLIC_TRANSPORT', ticketPrice: 45 },
      accommodations: [],
      others: [],
    },
    piecesJointes: [{ id: 1, expenseId: '3', fileUrl: 'https://example.com/receipt.pdf' }],
  },
  {
    id: 3,
    status: 'rejected',
    refundRequired: false,
    utilisateur: { id: 3, prenom: 'Pierre', nom: 'Bernard' },
    sortie: { ...mockEvent, id: 103, titre: 'Escalade Calanques', code: 'SORTIE-2025-003' },
    dateCreation: '2025-01-05T09:15:00',
    commentaireStatut: 'Justificatifs manquants',
    details: {
      transport: { type: 'PERSONAL_VEHICLE', distance: 200, tollFee: 20 },
      accommodations: [{ expenseId: '4', price: 120, comment: 'Hotel' }],
      others: [],
    },
    piecesJointes: [],
  },
  {
    id: 4,
    status: 'accounted',
    refundRequired: true,
    utilisateur: { id: 4, prenom: 'Sophie', nom: 'Leroy' },
    sortie: { ...mockEvent, id: 104, titre: 'Ski de rando Beaufortain', code: 'SORTIE-2025-004' },
    dateCreation: '2025-01-02T16:45:00',
    commentaireStatut: null,
    details: {
      transport: { type: 'CLUB_MINIBUS', distance: 100, fuelExpense: 60, tollFee: 10, passengerCount: 8 },
      accommodations: [{ expenseId: '5', price: 55, comment: 'Gite' }],
      others: [{ expenseId: '6', price: 15, comment: 'Materiel' }],
    },
    piecesJointes: [],
  },
  {
    id: 5,
    status: 'submitted',
    refundRequired: true,
    utilisateur: { id: 5, prenom: 'Luc', nom: 'Moreau' },
    sortie: { ...mockEvent, id: 105, titre: 'Canyon Ardeche', code: 'SORTIE-2025-005' },
    dateCreation: '2025-01-12T11:00:00',
    commentaireStatut: null,
    details: {
      transport: { type: 'RENTAL_MINIBUS', rentalPrice: 150, fuelExpense: 40, tollFee: 25, passengerCount: 6 },
      accommodations: [],
      others: [{ expenseId: '7', price: 30, comment: 'Location materiel' }],
    },
    piecesJointes: [],
  },
];

export const mockAuthResponse = {
  token: 'mock-jwt-token-for-testing',
  refresh_token: 'mock-refresh-token-for-testing',
  user: mockUser,
};

export const mockRefreshResponse = {
  token: 'mock-refreshed-jwt-token',
  refresh_token: 'mock-new-refresh-token',
};

const commissionEscalade = { id: 7, code: 'escalade', title: 'Escalade' };
const commissionRandonnee = { id: 4, code: 'randonnee', title: 'Randonnée' };

// Responsable de la commission Escalade ; la commission Randonnée n'en a pas, ses notes vont droit à la trésorerie.
const responsableEscalade = { id: 9, prenom: 'Hugo', nom: 'Blanc' };
const lucie = { id: 8, prenom: 'Lucie', nom: 'Roux' };
const thomas = { id: 10, prenom: 'Thomas', nom: 'Petit' };
const camille = { id: 11, prenom: 'Camille', nom: 'Faure' };

const validationParLeResponsable = {
  auteur: { prenom: 'Hugo', nom: 'BLANC' },
  date: '2025-01-27T18:30:00+01:00',
};

const achat = (id: number, objet: string, montant: number) => ({
  details: { lignes: [{ id: `ligne-${id}`, montant, description: objet }] },
  lignesAffichees: [{ id: `ligne-${id}`, nature: null, libelle: objet, detail: null, montant }],
  piecesJointes: [{ id, expenseId: `ligne-${id}`, fileUrl: `https://example.com/facture-${id}.pdf` }],
  totalDeclare: montant,
  totalRemboursable: montant,
});

const champsHorsSortie = {
  sortie: null,
  lienFormation: null,
  motPourResponsable: null,
  commentaireStatut: null,
  avertissements: [],
  valideurs: [],
  derniereDecision: null,
  validationResponsable: null,
};

/**
 * Notes hors sortie, au format de l'API (montants figés, lignes affichées, libellé comptable).
 * Les deux dernières n'attendent pas la trésorerie : la liste de l'API ne les renvoie pas.
 */
export const mockNotesHorsSortie = [
  {
    ...champsHorsSortie,
    ...achat(201, 'Cordelettes pour la SAE', 55),
    id: 201,
    type: 'autre',
    status: 'submitted',
    refundRequired: true,
    utilisateur: lucie,
    commission: commissionRandonnee,
    objet: 'Cordelettes pour la SAE',
    dateDepense: '2025-01-20',
    // Brouillon commencé le 21, envoyé le 23 : la liste montre l'envoi.
    dateCreation: '2025-01-21T09:00:00',
    dateEnvoi: '2025-01-23T09:05:00+01:00',
    libelleComptable: 'ROUX Lucie NDF 20/01/2025 Cordelettes pour la SAE',
  },
  {
    ...champsHorsSortie,
    id: 202,
    type: 'formation',
    status: 'preapproved',
    refundRequired: true,
    utilisateur: thomas,
    commission: commissionEscalade,
    objet: 'Formation initiateur escalade',
    dateDepense: '2025-01-25',
    lienFormation: 'https://example.com/formation-initiateur-escalade',
    motPourResponsable: 'Stage validé par la commission en décembre.',
    dateCreation: '2025-01-26T10:00:00',
    dateEnvoi: '2025-01-26T10:10:00+01:00',
    details: {
      lignes: [
        { id: 'ligne-202-stage', nature: 'stage', montant: 250, description: '' },
        { id: 'ligne-202-train', nature: 'train', montant: 62.4, description: '' },
      ],
    },
    lignesAffichees: [
      { id: 'ligne-202-stage', nature: 'stage', libelle: 'Stage', detail: null, montant: 250 },
      { id: 'ligne-202-train', nature: 'train', libelle: 'Train ou bus', detail: null, montant: 62.4 },
    ],
    piecesJointes: [{ id: 202, expenseId: 'ligne-202-stage', fileUrl: 'https://example.com/facture-stage.pdf' }],
    // Plafonnée : le remboursable est plus bas que le déclaré.
    totalDeclare: 312.4,
    totalRemboursable: 287.4,
    valideurs: [responsableEscalade],
    derniereDecision: { statut: 'preapproved', niveau: 'responsable', ...validationParLeResponsable, message: null },
    validationResponsable: validationParLeResponsable,
    libelleComptable: 'PETIT Thomas NDF 25/01/2025 Formation initiateur escalade',
  },
  {
    ...champsHorsSortie,
    ...achat(203, "Sac <b>30 L</b> & cordelette d'attache", 42),
    id: 203,
    type: 'autre',
    status: 'preapproved',
    refundRequired: false,
    utilisateur: camille,
    commission: commissionEscalade,
    objet: "Sac <b>30 L</b> & cordelette d'attache",
    dateDepense: '2025-01-18',
    dateCreation: '2025-01-19T15:00:00',
    dateEnvoi: '2025-01-19T15:02:00+01:00',
    valideurs: [responsableEscalade],
    derniereDecision: { statut: 'preapproved', niveau: 'responsable', ...validationParLeResponsable, message: null },
    validationResponsable: validationParLeResponsable,
    libelleComptable: "FAURE Camille NDF 18/01/2025 Sac <b>30 L</b> & cordelette d'attache",
  },
  {
    ...champsHorsSortie,
    id: 204,
    type: 'formation',
    status: 'approved',
    refundRequired: true,
    utilisateur: lucie,
    commission: commissionRandonnee,
    objet: 'Recyclage initiateur randonnée',
    dateDepense: '2025-01-11',
    dateCreation: '2025-01-12T08:00:00',
    dateEnvoi: '2025-01-12T08:01:00+01:00',
    details: { lignes: [{ id: 'ligne-204-stage', nature: 'stage', montant: 120, description: '' }] },
    lignesAffichees: [{ id: 'ligne-204-stage', nature: 'stage', libelle: 'Stage', detail: null, montant: 120 }],
    piecesJointes: [],
    totalDeclare: 120,
    totalRemboursable: 120,
    derniereDecision: {
      statut: 'approved',
      niveau: 'tresorerie',
      auteur: { prenom: 'Claire', nom: 'FONTAINE' },
      date: '2025-01-13T11:00:00+01:00',
      message: null,
    },
    libelleComptable: 'ROUX Lucie NDF 11/01/2025 Recyclage initiateur randonnée',
  },
  {
    ...champsHorsSortie,
    ...achat(205, 'Prises pour le pan', 89.9),
    id: 205,
    type: 'autre',
    status: 'rejected',
    refundRequired: true,
    utilisateur: thomas,
    commission: commissionEscalade,
    objet: 'Prises pour le pan',
    dateDepense: '2025-01-14',
    dateCreation: '2025-01-15T19:00:00',
    dateEnvoi: '2025-01-15T19:01:00+01:00',
    commentaireStatut: 'Il manque la facture.',
    valideurs: [responsableEscalade],
    derniereDecision: {
      statut: 'rejected',
      niveau: 'tresorerie',
      auteur: { prenom: 'Claire', nom: 'FONTAINE' },
      date: '2025-01-29T09:00:00+01:00',
      message: 'Il manque la facture.',
    },
    validationResponsable: validationParLeResponsable,
    libelleComptable: 'PETIT Thomas NDF 14/01/2025 Prises pour le pan',
  },
  {
    ...champsHorsSortie,
    ...achat(208, 'Trousse de secours', 32.5),
    id: 208,
    type: 'autre',
    status: 'accounted',
    refundRequired: true,
    utilisateur: camille,
    commission: commissionRandonnee,
    objet: 'Trousse de secours',
    dateDepense: '2025-01-05',
    dateCreation: '2025-01-06T12:00:00',
    dateEnvoi: '2025-01-06T12:01:00+01:00',
    derniereDecision: {
      statut: 'approved',
      niveau: 'tresorerie',
      auteur: { prenom: 'Claire', nom: 'FONTAINE' },
      date: '2025-01-07T10:00:00+01:00',
      message: null,
    },
    libelleComptable: 'FAURE Camille NDF 05/01/2025 Trousse de secours',
  },
  {
    ...champsHorsSortie,
    ...achat(206, 'Piles pour les DVA', 24.9),
    id: 206,
    type: 'autre',
    status: 'submitted',
    refundRequired: true,
    utilisateur: camille,
    commission: commissionEscalade,
    objet: 'Piles pour les DVA',
    dateDepense: '2025-01-28',
    dateCreation: '2025-01-28T20:00:00',
    dateEnvoi: '2025-01-28T20:01:00+01:00',
    // Chez le responsable : la trésorerie ne la voit pas encore.
    valideurs: [responsableEscalade],
    libelleComptable: 'FAURE Camille NDF 28/01/2025 Piles pour les DVA',
  },
  {
    ...champsHorsSortie,
    ...achat(207, 'Gants pour la via ferrata', 60),
    id: 207,
    type: 'autre',
    status: 'draft',
    refundRequired: true,
    utilisateur: lucie,
    commission: commissionRandonnee,
    objet: 'Gants pour la via ferrata',
    dateDepense: '2025-01-30',
    dateCreation: '2025-01-30T08:00:00',
    dateEnvoi: null,
    libelleComptable: null,
  },
];

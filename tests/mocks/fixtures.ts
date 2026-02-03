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

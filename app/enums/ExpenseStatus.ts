export enum ExpenseStatus {
  // Seulement par l'adresse d'une note : la liste de l'API n'envoie pas les brouillons des notes hors sortie.
  DRAFT = "draft",
  SUBMITTED = "submitted",
  // Note hors sortie validée par le responsable de sa commission : elle attend la trésorerie.
  PREAPPROVED = "preapproved",
  REJECTED = "rejected",
  APPROVED = "approved",
  ACCOUNTED = "accounted",
}

export const getExpenseStatusTranslation = (status: ExpenseStatus): string => {
  switch (status) {
    case ExpenseStatus.DRAFT:
      return "Brouillon";
    case ExpenseStatus.SUBMITTED:
      return "Soumis";
    case ExpenseStatus.PREAPPROVED:
      return "Validée par le responsable";
    case ExpenseStatus.REJECTED:
      return "Rejeté";
    case ExpenseStatus.APPROVED:
      return "Approuvé";
    case ExpenseStatus.ACCOUNTED:
      return "Comptabilisé";
    default:
      return "Inconnu";
  }
};

export const getExpenseStatusColor = (status: ExpenseStatus): string => {
  switch (status) {
    case ExpenseStatus.SUBMITTED:
      return "blue";
    case ExpenseStatus.PREAPPROVED:
      return "teal";
    case ExpenseStatus.REJECTED:
      return "red";
    case ExpenseStatus.APPROVED:
      return "green";
    case ExpenseStatus.ACCOUNTED:
      return "purple";
    default:
      return "gray";
  }
};

export default ExpenseStatus;

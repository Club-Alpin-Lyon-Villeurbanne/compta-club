export enum ExpenseStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
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
    case ExpenseStatus.DRAFT:
      return "gray";
    case ExpenseStatus.SUBMITTED:
      return "blue";
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

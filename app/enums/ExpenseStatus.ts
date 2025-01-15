export enum ExpenseStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  REJECTED = "rejected",
  APPROVED = "approved",
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
    default:
      return "gray";
  }
};

export default ExpenseStatus;

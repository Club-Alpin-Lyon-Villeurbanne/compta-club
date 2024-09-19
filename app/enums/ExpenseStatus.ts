export enum ExpenseStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  PENDING = "pending",
  VALIDATED = "validated",
  REJECT = "rejected",
  APPROVED = "approved",
  VALIDATE = "validate",
}

export const getExpenseStatusTranslation = (status: ExpenseStatus): string => {
  switch (status) {
    case ExpenseStatus.DRAFT:
      return "Brouillon";
    case ExpenseStatus.SUBMITTED:
      return "Soumis";
    case ExpenseStatus.PENDING:
      return "En attente";
    case ExpenseStatus.VALIDATED:
      return "Validé";
    case ExpenseStatus.VALIDATE:
      return "Valider";
    case ExpenseStatus.REJECT:
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
        case ExpenseStatus.PENDING:
        return "yellow";
        case ExpenseStatus.VALIDATED:
        return "green";
        case ExpenseStatus.VALIDATE:
        return "green";
        case ExpenseStatus.REJECT:
        return "red";
        case ExpenseStatus.APPROVED:
        return "green";
        default:
        return "gray";
    }
}

export default ExpenseStatus;

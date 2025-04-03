export type User = {
  id: string;
  name: string;
  email: string;
};

export type Props = {
  children: React.ReactNode;
};

export enum ExpenseStatus {
  Approved = "approved",
  Rejected = "rejected",
}

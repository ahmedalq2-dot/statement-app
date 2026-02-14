
export enum TransactionType {
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit'
}

export interface Transaction {
  id: string;
  date: string;
  detail: string;
  type: TransactionType;
  amount: number;
  balance: number;
  tag: string;
}

export interface StatementSummary {
  totalWithdrawals: number;
  totalDeposits: number;
  netChange: number;
  transactionCount: number;
}

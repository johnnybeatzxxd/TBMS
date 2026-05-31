export type FinancialCommitmentSchedule = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";

export interface ExpenseBreakdown {
  yearly: number;
  quarterly: number;
  monthly: number;
  weekly: number;
  daily: number;
}

export interface FinancialCommitmentOutput {
  endDate: string;
  paymentsMade: number;
  amountPaid: number;
  remainingPayments: number;
  outstandingAmount: number;
  totalAmount: number;
  expensesBreakdown: ExpenseBreakdown;
}

export interface FinancialCommitment {
  id: string;
  adminId: string;
  description: string;
  schedule: FinancialCommitmentSchedule;
  daysInterval: number;
  regularPaymentAmount?: number;
  totalPaymentAmount?: number;
  totalNumberOfPayments?: number;
  startingDate: string;
  output?: FinancialCommitmentOutput;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFinancialCommitmentPayload {
  description: string;
  schedule: FinancialCommitmentSchedule;
  startingDate: string; // YYYY-MM-DD
  daysInterval?: number;
  regularPaymentAmount?: number;
  totalPaymentAmount?: number;
  totalNumberOfPayments?: number;
}

export interface TotalExpenseBreakdownValue {
  total: number;
  perTruck: number;
}

export interface TotalExpenseBreakdown {
  yearly: TotalExpenseBreakdownValue;
  quarterly: TotalExpenseBreakdownValue;
  monthly: TotalExpenseBreakdownValue;
  weekly: TotalExpenseBreakdownValue;
  daily: TotalExpenseBreakdownValue;
}

export interface FinancialCommitmentsResponse {
  data: FinancialCommitment[];
  totalExpenseBreakdown?: TotalExpenseBreakdown;
}

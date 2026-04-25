export interface Expense {
  id: string;
  truckId: string;
  remark: string;
  price: number;
  date: string;
}

export interface AddExpensePayload {
  truckId: string;
  remark: string;
  price: number;
  date: string;
}

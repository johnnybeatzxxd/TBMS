export interface Transfer {
  id: string;
  driverId: string;
  amount: number;
  type: "increment" | "decrement";
  remark: string;
  date: string;
}

export interface AddTransferPayload {
  driverId: string;
  amount: number;
  type: "increment" | "decrement";
  remark: string;
  date: string;
}

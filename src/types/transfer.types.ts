export interface Transfer {
  _id: string;
  driverId: string;
  adminId?: string;
  amount: number;
  remark: string;
  date: string;
  sender: "ADMIN" | "DRIVER";
  status: "PENDING" | "APPROVED";
  createdAt: string;
  updatedAt: string;
}

export interface AddTransferPayload {
  driverId?: string;
  amount: number;
  remark: string;
  date: string;
}

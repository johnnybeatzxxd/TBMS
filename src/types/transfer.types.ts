export interface Transfer {
  id?: string;
  _id?: string;
  driverId: string;
  adminId?: string;
  amount: number;
  remark: string;
  date: string;
  sender: "ADMIN" | "DRIVER";
  status?: "PENDING" | "APPROVED";
  approved?: "PENDING" | "APPROVED";
  bank?: string;
  receiptPics?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AddTransferPayload {
  driverId?: string;
  amount: number;
  remark: string;
  date: string;
  bank?: string;
  receiptPics?: string[];
}

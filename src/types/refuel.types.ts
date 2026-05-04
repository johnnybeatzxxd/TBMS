export interface Refuel {
  id: string; // The backend might return 'id' or '_id', we'll accept both in usage but normalize in service
  _id?: string;
  liters: number;
  price: number;
  date: string;
  receiptPic?: string[];
  truckId: string;
  driverId: string;
  adminId: string;
  approved: "PENDING" | "APPROVED";
  createdAt: string;
  updatedAt: string;
  location?: string;
  km?: number;
  fullTank?: boolean;
}

export interface GetRefuelsParams {
  page?: number;
  perpage?: number;
  truckId?: string;
  startDate?: string;
  endDate?: string;
  approved?: "APPROVED" | "PENDING";
  litersFrom?: number;
  litersTo?: number;
  priceFrom?: number;
  priceTo?: number;
  driverId?: string;
  location?: string;
  km?: number;
  fullTank?: boolean;
}

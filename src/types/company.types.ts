export interface Company {
  id: string;
  name: string;
  currentBalance: number;
  totalBalance: number;
  adminId: string;
  allowedTrucks?: any[]; // Populated conditionally by backend
  createdAt: string;
  updatedAt: string;
}

export interface AddCompanyPayload {
  name: string;
  currentBalance: number;
  totalBalance?: number;
}

export interface RegisterPaymentPayload {
  companyId: string;
  amount: number;
  date?: string | Date;
}

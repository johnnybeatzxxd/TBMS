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

export interface UpdateCompanyPaymentPayload {
  amount: number;
  date?: string | Date;
}

/** Balances for one truck under one company (GET get-truck-company-info). */
export interface TruckCompanyBalance {
  currentBalance: number;
  totalBalance: number;
}

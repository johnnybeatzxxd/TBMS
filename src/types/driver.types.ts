export interface Driver {
  id: string; // driver profile id
  name: string;
  truckId: string;
  adminId: string;
  accountId: string;
  username?: string;
  password?: string;
  accountActive: boolean;
  licenseRenewalDate?: string;
  oilChangeDate?: string;
  balance?: number;
  approvedBalance?: number;
}

export interface CreateDriverPayload {
  name: string;
  username?: string;
  password?: string;
  truckId: string;
  licenseRenewalDate?: string;
  oilChangeDate?: string;
}

export interface UpdateDriverPayload {
  name?: string;
  username?: string;
  password?: string;
  truckId?: string;
  licenseRenewalDate?: string;
  oilChangeDate?: string;
}

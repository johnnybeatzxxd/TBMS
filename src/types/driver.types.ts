export interface Driver {
  id: string; // driver profile id
  name: string;
  truckId: string;
  adminId: string;
  accountId: string;
  username?: string;
  password?: string;
  accountActive: boolean;
}

export interface CreateDriverPayload {
  name: string;
  username?: string;
  password?: string;
  truckId: string;
}

export interface UpdateDriverPayload {
  name?: string;
  username?: string;
  password?: string;
  truckId: string;
}

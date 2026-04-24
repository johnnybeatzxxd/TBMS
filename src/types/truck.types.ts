export interface Truck {
  id: string;
  plateNumber: string;
  vinNumber?: string;
  adminId: string;
}

export interface AddTruckPayload {
  plateNumber: string;
  vinNumber?: string;
}

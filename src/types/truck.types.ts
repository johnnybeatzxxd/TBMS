export interface Truck {
  id: string;
  plateNumber: string;
  vinNumber?: string;
  brand?: string;
  model?: string;
  adminId: string;
}

export interface AddTruckPayload {
  plateNumber: string;
  vinNumber?: string;
  brand?: string;
  model?: string;
}

export interface UpdateTruckPayload {
  plateNumber?: string;
  vinNumber?: string;
  brand?: string;
  model?: string;
}

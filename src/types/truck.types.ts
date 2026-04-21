export interface Truck {
  id: string;
  plateNumber: string;
  model: string;
  year: number;
  status: "active" | "maintenance" | "idle" | "retired";
  driverId?: string;
  lastLocation?: {
    lat: number;
    lng: number;
    address: string;
    updatedAt: string;
  };
  mileage: number;
  fuelLevel: number; // percentage 0-100
  createdAt: string;
  updatedAt: string;
}

export interface TruckFilters {
  status?: Truck["status"];
  search?: string;
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: "available" | "on-trip" | "off-duty" | "suspended";
  assignedTruckId?: string;
  totalTrips: number;
  totalKm: number;
  avatar?: string;
  createdAt: string;
}

export interface DriverFilters {
  status?: Driver["status"];
  search?: string;
}

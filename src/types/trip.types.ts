export interface Trip {
  id: string;
  truckId: string;
  driverId: string;
  origin: string;
  destination: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  distanceKm: number;
  cargoDescription?: string;
  cargoWeightTons?: number;
  notes?: string;
  createdAt: string;
}

export interface TripFilters {
  status?: Trip["status"];
  driverId?: string;
  truckId?: string;
  search?: string;
}

export interface Trip {
  id: string;
  date: string;
  loadingSite: string;
  destinationSite: string;
  volume: "MCUBE10" | "MCUBE16";
  paymentMethod: "CASH" | "CREDIT";
  amount?: number;
  roadExpence?: number;
  
  // Relations
  truckId: string;
  driverId: string;
  companyId?: string; 

  // Status Fields
  approved?: "PENDING" | "APPROVED" | "DECLINED"; // for Cash trips
  claimed?: boolean; // for Credit trips

  createdAt: string;
  updatedAt: string;
}

export interface AddTripPayload {
  date: string | Date;
  loadingSite: string;
  destinationSite: string;
  volume: "MCUBE10" | "MCUBE16";
  paymentMethod: "CASH" | "CREDIT";
  amount?: number;
  roadExpence?: number;
  companyId?: string;
}

export interface UpdateTripPayload {
  paymentMethod: "CASH" | "CREDIT";
  date?: string | Date;
  loadingSite?: string;
  destinationSite?: string;
  volume?: "MCUBE10" | "MCUBE16";
  amount?: number;
  roadExpence?: number;
}

export interface GetTripsQuery {
  page?: number;
  perpage?: number;
  truckId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  paymentMethod?: "CASH" | "CREDIT";
  approved?: "PENDING" | "APPROVED" | "DECLINED";
  loadingSite?: string;
  destinationSite?: string;
  amount?: number;
  roadExpence?: number;
  volume?: "MCUBE10" | "MCUBE16";
  claimed?: boolean;
}

export interface PaginatedTrips {
  data: Trip[]; // The API sometimes returns `allTrips` and sometimes `data`. The wrapper will standardize this.
  meta: {
    totalItems: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
  };
}

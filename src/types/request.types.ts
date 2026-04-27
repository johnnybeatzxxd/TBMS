export type RequestStatus = "pending" | "accepted" | "declined";

export type RequestType = 
  | "Oil Change"
  | "Tire Replacement"
  | "Maintenance"
  | "Advance Payment"
  | "Salary"
  | "Other";

export interface ServiceRequest {
  id: string;
  driverId: string;
  truckId: string;
  type: RequestType;
  status: RequestStatus;
  amount?: number; // Mostly for Advance Payment / Salary / Specific Maintenance
  description: string;
  date: string; // ISO format YYYY-MM-DD
  createdAt: string; // Full ISO datetime
  updatedAt: string; // Full ISO datetime
}

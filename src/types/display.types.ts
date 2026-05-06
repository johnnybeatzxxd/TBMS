export interface RollingDisplay {
  id?: string;
  _id?: string;
  displayMessage: string;
  displayActive: boolean;
  forDrivers: string[]; // Array of Driver profile IDs
  adminId?: string;
  startTime: string; // ISO Date String
  endTime: string; // ISO Date String
  createdAt?: string;
  updatedAt?: string;
}

export interface AddDisplayPayload {
  displayMessage: string; // Max 256 chars
  displayActive?: boolean;
  forDrivers?: string[];
  startTime?: string;
  endTime?: string;
}

export interface UpdateDisplayPayload {
  displayMessage?: string;
  displayActive?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  accountId: string;
  deviceToken: string | null;
  createdAt: string;
  updatedAt: string;
  trucks: any[];
  contractedCompanies: any[];
  // Driver-specific fields (if applicable)
  assignedTruckId?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: "admin" | "driver" | "manager";
  profile: UserProfile;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

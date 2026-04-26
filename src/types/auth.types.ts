export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "manager" | "driver" | "admin";
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  role: "manager" | "driver" | "admin";
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

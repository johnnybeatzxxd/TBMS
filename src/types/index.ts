export * from "./auth.types";
export * from "./truck.types";
export * from "./trip.types";
export * from "./driver.types";
export * from "./expense.types";
export * from "./transfer.types";
export * from "./company.types";
export * from "./refuel.types";

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

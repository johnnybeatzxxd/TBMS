/**
 * Analysis API Types
 * ------------------
 * Interfaces for all /analysis/* endpoint payloads and responses.
 * Derived from actual backend response shapes.
 */

// ─── Common Filter Payload ──────────────────────────────────────────
export interface AnalysisFilters {
  period?: "today" | "week" | "month" | "year" | "custom";
  truckIds?: string[];
  driverId?: string;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  groupBy?: "truck" | "driver" | "day" | "week" | "month";
  page?: number;
  limit?: number;
}

// ─── Pagination Wrapper ─────────────────────────────────────────────
export interface PaginatedBreakdown<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Dashboard ──────────────────────────────────────────────────────
export interface DashboardPayload {
  period?: "today" | "week" | "month" | "year" | "custom";
  truckIds?: string[];
  startDate?: string;
  endDate?: string;
}

export interface DashboardSummary {
  cashTripsCount: number;
  creditTripsCount: number;
  totalTripsCount: number;
  refuelCount: number;
  totalFuelCost: number;
  totalDriverExpense: number;
  expenseCount: number;
  totalExpensesCost: number;
}

export interface DashboardPending {
  trips: number;
  refuels: number;
  expenses: number;
  transfers: number;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  pending: DashboardPending;
}

// ─── Trip Summary ───────────────────────────────────────────────────
export type TripsSummaryPayload = AnalysisFilters;

export interface TripTypeMetrics {
  count: number;
  totalAmount: number;
  roadExpenses: number;
}

export interface TripsSummary {
  cashTrips: TripTypeMetrics;
  creditTrips: TripTypeMetrics;
  totalExpenses: number;
  totalFuelCost: number;
  totalFuelLiters: number;
  totalTripsCount: number;
  approvedTripsCount: number;
  totalProfit: number;
  averageProfitPerTrip: number;
  averageFuelUsagePerTrip: number;
  averageExpensesPerTrip: number;
  totalDriverExpense: number;
  totalTruckExpence: number;
  averageDriverExpensePerTrip: number;
}

export interface TripBreakdownItem extends TripsSummary {
  key: string; // date/week/month/truckId/driverId depending on groupBy
}

export interface TripsSummaryResponse {
  summary: TripsSummary;
  breakdown: PaginatedBreakdown<TripBreakdownItem>;
}

// ─── Trip Routes ────────────────────────────────────────────────────
export type RoutesPayload = AnalysisFilters;

export interface RouteItem {
  loadingSite: string;
  destinationSite: string;
  cashTripsCount: number;
  creditTripsCount: number;
  totalTripsCount: number;
}

export interface RoutesResponse {
  data: RouteItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── Fuel List ──────────────────────────────────────────────────────
export interface FuelListPayload extends Omit<AnalysisFilters, "truckIds" | "groupBy"> {
  truckId: string;
}

export interface FuelListItem {
  startDate: string;
  endDate: string;
  totalFuelLiters: number;
  kmDriven: number;
  totalCost: number;
  fuelCostPerKm: number | null;
  averageFuelPrice: number;
  tripsCount: number;
  litersPerKm: number | null;
}

export interface FuelListResponse {
  data: FuelListItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── Fuel Usage ─────────────────────────────────────────────────────
export type FuelUsagePayload = AnalysisFilters;

export interface FuelUsageSummary {
  totalLiters: number;
  totalCost: number;
  totalTrips: number;
  fuelUsagePerTrip: number;
  fuleCostPerTrip: number; // note: typo matches backend
  averageFuelPrice: number;
}

export interface FuelUsageBreakdownItem {
  key: string;
  totalLiters?: number;
  totalCost?: number;
  totalTrips?: number;
  fuelUsagePerTrip?: number;
  fuleCostPerTrip?: number;
  averageFuelPrice?: number;
  liters?: number;
  cost?: number;
  count?: number;
  avgPricePerLiter?: number;
}

export interface FuelUsageResponse {
  summary: FuelUsageSummary;
  breakdown: PaginatedBreakdown<FuelUsageBreakdownItem>;
}

// ─── Expenses ───────────────────────────────────────────────────────
export type ExpensesPayload = AnalysisFilters;

export interface DriverExpenseBreakdown {
  total: number;
  roadExpenses: number;
  salary: number;
  perdiem: number;
}

export interface TruckExpenseByServiceType {
  serviceTypeId: string;
  serviceTypeName: string;
  total: number;
}

export interface TruckExpensesBreakdown {
  total: number;
  byServiceType: TruckExpenseByServiceType[];
  otherExpensesTotal: number;
}

export interface ExpensesSummary {
  total: number;
  driverExpense: DriverExpenseBreakdown;
  fuelExpense: number;
  truckExpenses: TruckExpensesBreakdown;
}

export interface ExpensesBreakdownItem extends ExpensesSummary {
  key: string;
}

export interface ExpensesResponse {
  summary: ExpensesSummary;
  breakdown?: PaginatedBreakdown<ExpensesBreakdownItem>;
}

// ─── Profit ─────────────────────────────────────────────────────────
export type ProfitPayload = AnalysisFilters;

export interface ProfitSummary {
  revenue: number;
  costs: number;
  profit: number;
  margin: number; // percentage
}

export interface ProfitCostBreakdown {
  revenue: {
    cash: number;
    credit: number;
  };
  costs: {
    fuel: number;
    expenses: number;
    roadExpenses: number;
  };
}

export interface ProfitDataItem {
  key: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  breakdown: ProfitCostBreakdown;
}

export interface ProfitResponse {
  summary: ProfitSummary;
  data: ProfitDataItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── Performance ────────────────────────────────────────────────────
export interface PerformancePayload {
  groupBy?: "truck" | "driver";
  truckIds?: string[];
  driverId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PerformanceItem {
  entity: string;
  totalTrips: number;
  approvalRate: number;
  revenue: number;
  driverExpense: number;
  truckExpense: number;
  fuelCost: number;
  driverExpenseToRevnueRatio: number; // note: typo matches backend
  litersPerTrip: number;
  fuelCostPerTrip: number;
  profit: number;
}

export interface PerformanceResponse {
  data: PerformanceItem[];
}

// ─── Compare ────────────────────────────────────────────────────────
export interface ComparePayload {
  entityType?: "truck" | "driver";
  entityIds?: string[];
  groupBy?: "day" | "week" | "month";
  startDate?: string;
  endDate?: string;
  truckIds?: string[];
}

export interface CompareMetrics {
  revenue: number;
  profit: number;
  fuel_usage: number;
  fuel_usage_per_trip: number;
  expense: number;
  trip_count: number;
}

export interface CompareBreakdownItem {
  key: string;
  metrics: CompareMetrics;
}

export interface CompareEntity {
  name: string;
  summary: CompareMetrics;
  breakdown?: CompareBreakdownItem[];
}

export interface CompareResponse {
  comparison: CompareEntity[];
}

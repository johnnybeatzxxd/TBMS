/**
 * Analysis API Types
 * ------------------
 * Interfaces for all /analysis/* endpoint payloads and responses.
 * Derived from actual backend response shapes.
 */

// ─── Common Filter Payload ──────────────────────────────────────────
export interface AnalysisFilters {
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
export interface TripsSummaryPayload extends AnalysisFilters {}

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
export interface RoutesPayload extends AnalysisFilters {}

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
export interface FuelListPayload extends AnalysisFilters {}

export interface FuelListItem {
  id: string;
  date: string;
  price: number;
  vol: number;
  truckId: string;
  prevKm?: number;
  kmDifference?: number;
  pricePerLiter?: number;
}

export interface FuelListResponse {
  data: FuelListItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── Fuel Usage ─────────────────────────────────────────────────────
export interface FuelUsagePayload extends AnalysisFilters {}

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
  totalLiters: number;
  totalCost: number;
  totalTrips: number;
  fuelUsagePerTrip: number;
  fuleCostPerTrip: number;
  averageFuelPrice: number;
}

export interface FuelUsageResponse {
  summary: FuelUsageSummary;
  breakdown: PaginatedBreakdown<FuelUsageBreakdownItem>;
}

// ─── Expenses ───────────────────────────────────────────────────────
export interface ExpensesPayload extends AnalysisFilters {}

export interface ExpensesCategorySummary {
  total: number;
  perdime: number;
  salary: number;
  maintenance: number;
  refuel: number;
  roadExpenses: number;
  other: number;
}

export interface ExpensesBreakdownItem extends ExpensesCategorySummary {
  key: string;
}

export interface ExpensesResponse {
  summary: ExpensesCategorySummary;
  breakdown: PaginatedBreakdown<ExpensesBreakdownItem>;
}

// ─── Profit ─────────────────────────────────────────────────────────
export interface ProfitPayload extends AnalysisFilters {}

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
  startDate?: string;
  endDate?: string;
}

export interface PerformanceItem {
  entity: string;
  totalTrips: number;
  approvalRate: number;
  revenue: number;
  roadExpenseToRevnueRatio: number; // note: typo matches backend
  liters: number;
  fuelEfficiency: number | null;
  litersPerTrip: number;
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

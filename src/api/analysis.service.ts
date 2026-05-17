/**
 * Analysis Service API
 * --------------------
 * Real API service for all /analysis/* endpoints.
 * All routes use POST with JSON body for complex filtering.
 * Requires ADMIN role authentication.
 */

import { apiFetch } from "./config";
import {
  DashboardPayload,
  DashboardResponse,
  TripsSummaryPayload,
  TripsSummaryResponse,
  RoutesPayload,
  RoutesResponse,
  FuelListPayload,
  FuelListResponse,
  FuelUsagePayload,
  FuelUsageResponse,
  ExpensesPayload,
  ExpensesResponse,
  ProfitPayload,
  ProfitResponse,
  PerformancePayload,
  PerformanceResponse,
  ComparePayload,
  CompareResponse,
} from "@/src/types/analysis.types";

const handleError = async (res: Response, fallbackMsg: string) => {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.message || fallbackMsg);
};

export const analysisService = {
  /**
   * POST /analysis/dashboard
   * High-level fleet overview with pending item counts.
   */
  async getDashboard(payload: DashboardPayload = {}): Promise<DashboardResponse> {
    const res = await apiFetch("/analysis/dashboard", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res, "Failed to fetch dashboard");
    return res.json();
  },

  /**
   * POST /analysis/trips/summary
   * Comprehensive trip analytics with grouping and time buckets.
   */
  async getTripsSummary(payload: TripsSummaryPayload = {}): Promise<TripsSummaryResponse> {
    const res = await apiFetch("/analysis/trips/summary", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res, "Failed to fetch trip summary");
    return res.json();
  },

  /**
   * POST /analysis/trips/routes
   * Popularity analysis of loading/destination site combinations.
   */
  async getRoutes(payload: RoutesPayload = {}): Promise<RoutesResponse> {
    const res = await apiFetch("/analysis/trips/routes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res, "Failed to fetch routes");
    return res.json();
  },

  /**
   * POST /analysis/fuel/list
   * Paginated list of refuel logs with distance/price calculations.
   */
  async getFuelList(payload: FuelListPayload = {}): Promise<FuelListResponse> {
    const res = await apiFetch("/analysis/fuel/list", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res, "Failed to fetch fuel list");
    return res.json();
  },

  /**
   * POST /analysis/fuel/usage
   * Fuel efficiency metrics (liters/trip, cost/trip) with grouping.
   */
  async getFuelUsage(payload: FuelUsagePayload = {}): Promise<FuelUsageResponse> {
    const res = await apiFetch("/analysis/fuel/usage", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res, "Failed to fetch fuel usage");
    return res.json();
  },

  /**
   * POST /analysis/expenses
   * Granular expense breakdown (Perdime, Salary, Maintenance, etc.).
   */
  async getExpenses(payload: ExpensesPayload = {}): Promise<ExpensesResponse> {
    const res = await apiFetch("/analysis/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res, "Failed to fetch expenses");
    return res.json();
  },

  /**
   * POST /analysis/profit
   * Financial profit/loss analysis with margin calculations.
   */
  async getProfit(payload: ProfitPayload = {}): Promise<ProfitResponse> {
    const res = await apiFetch("/analysis/profit", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res, "Failed to fetch profit");
    return res.json();
  },

  /**
   * POST /analysis/performance
   * Efficiency metrics (approval rate, liters/trip) per truck or driver.
   */
  async getPerformance(payload: PerformancePayload = {}): Promise<PerformanceResponse> {
    const res = await apiFetch("/analysis/performance", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res, "Failed to fetch performance");
    return res.json();
  },

  /**
   * POST /analysis/compare
   * Side-by-side comparison of multiple trucks or drivers.
   */
  async getCompare(payload: ComparePayload = {}): Promise<CompareResponse> {
    const res = await apiFetch("/analysis/compare", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res, "Failed to fetch comparison");
    return res.json();
  },
};

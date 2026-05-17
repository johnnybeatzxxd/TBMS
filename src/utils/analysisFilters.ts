/**
 * Analysis Filter Utilities
 * -------------------------
 * Maps UI filter state (presets, truck picker, driver picker)
 * to backend payload format.
 * The dashboard endpoint uses `period` while other endpoints use startDate/endDate.
 */

import { DateFilterPreset } from "@/src/components/DateFilterBar";
import { DashboardPayload, AnalysisFilters } from "@/src/types/analysis.types";
import { AnalysisFilterState, GroupByOption } from "@/src/components/AnalysisHeader";

/**
 * Parse URL params into initial filter state
 */
export function getInitialFiltersFromParams(params: any, defaultGroupBy: GroupByOption = "day"): AnalysisFilterState {
  let truckIds: string[] = [];
  if (params.truckIds) {
    const raw = Array.isArray(params.truckIds) ? params.truckIds.join(",") : String(params.truckIds);
    truckIds = raw.split(",").map((id) => id.trim()).filter(Boolean);
  } else if (params.truckId && params.truckId !== "all") {
    truckIds = [String(params.truckId)];
  }

  return {
    preset: (params.preset as DateFilterPreset) || "all",
    customFrom: params.customFrom ? new Date(params.customFrom) : null,
    customTo: params.customTo ? new Date(params.customTo) : null,
    truckIds,
    driverId: (params.driverId as string) || "all",
    groupBy: (params.groupBy as GroupByOption) || defaultGroupBy,
  };
}

/**
 * Serialize filters for deep-dive navigation query strings
 */
export function buildAnalysisQueryString(filters: AnalysisFilterState): string {
  const queryParams = new URLSearchParams();
  if (filters.truckIds.length > 0) {
    queryParams.append("truckIds", filters.truckIds.join(","));
  }
  if (filters.driverId !== "all") queryParams.append("driverId", filters.driverId);
  if (filters.preset) queryParams.append("preset", filters.preset);
  if (filters.customFrom) queryParams.append("customFrom", filters.customFrom.toISOString());
  if (filters.customTo) queryParams.append("customTo", filters.customTo.toISOString());
  if (filters.groupBy) queryParams.append("groupBy", filters.groupBy);
  const q = queryParams.toString();
  return q ? `?${q}` : "";
}

/**
 * Convert a UI preset into an ISO date range { startDate, endDate }.
 */
function presetToDateRange(
  preset: DateFilterPreset,
  customFrom: Date | null,
  customTo: Date | null
): { startDate?: string; endDate?: string } {
  if (preset === "all") return {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (preset === "today") {
    const iso = today.toISOString().split("T")[0];
    return { startDate: iso, endDate: iso };
  }

  if (preset === "week") {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return {
      startDate: weekAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  }

  if (preset === "month") {
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return {
      startDate: monthAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  }

  if (preset === "custom") {
    return {
      startDate: customFrom ? customFrom.toISOString().split("T")[0] : undefined,
      endDate: customTo ? customTo.toISOString().split("T")[0] : undefined,
    };
  }

  return {};
}

function applyTruckIds(payload: { truckIds?: string[] }, truckIds: string[]) {
  if (truckIds.length > 0) {
    payload.truckIds = truckIds;
  }
}

/**
 * Build the payload for the /analysis/dashboard endpoint.
 * Dashboard uses `period` instead of startDate/endDate (except for "custom").
 */
export function buildDashboardPayload(
  preset: DateFilterPreset,
  truckIds: string[],
  customFrom: Date | null,
  customTo: Date | null
): DashboardPayload {
  const payload: DashboardPayload = {};

  const periodMap: Record<DateFilterPreset, DashboardPayload["period"]> = {
    all: "year",
    today: "today",
    week: "week",
    month: "month",
    custom: "custom",
  };
  payload.period = periodMap[preset] || "month";

  if (preset === "custom") {
    if (customFrom) payload.startDate = customFrom.toISOString().split("T")[0];
    if (customTo) payload.endDate = customTo.toISOString().split("T")[0];
  }

  applyTruckIds(payload, truckIds);

  return payload;
}

/**
 * Build the payload for all other /analysis/* endpoints from filter fields.
 */
export function buildAnalysisPayload(
  preset: DateFilterPreset,
  truckIds: string[],
  customFrom: Date | null,
  customTo: Date | null,
  groupBy?: AnalysisFilters["groupBy"],
  page?: number,
  limit?: number,
  driverId?: string | null
): AnalysisFilters {
  const payload: AnalysisFilters = {};

  const { startDate, endDate } = presetToDateRange(preset, customFrom, customTo);
  if (startDate) payload.startDate = startDate;
  if (endDate) payload.endDate = endDate;

  applyTruckIds(payload, truckIds);

  if (driverId && driverId !== "all") {
    payload.driverId = driverId;
  }

  if (groupBy) payload.groupBy = groupBy;

  if (page) payload.page = page;
  if (limit) payload.limit = limit;

  return payload;
}

/**
 * Build the payload directly from an AnalysisFilterState object.
 */
export function buildPayloadFromFilters(
  filters: AnalysisFilterState,
  overrides?: { groupBy?: AnalysisFilters["groupBy"]; page?: number; limit?: number }
): AnalysisFilters {
  return buildAnalysisPayload(
    filters.preset,
    filters.truckIds,
    filters.customFrom,
    filters.customTo,
    overrides?.groupBy || (filters.groupBy as AnalysisFilters["groupBy"]),
    overrides?.page,
    overrides?.limit,
    filters.driverId
  );
}

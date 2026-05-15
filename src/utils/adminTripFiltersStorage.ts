import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DateFilterPreset } from "@/src/components/DateFilterBar";

export const ADMIN_TRIP_FILTERS_OPEN_KEY = "@admin_trip_filters_open_v1";
export const ADMIN_TRIP_FILTERS_APPLY_KEY = "@admin_trip_filters_apply_v1";

export type AdminTripFiltersSnapshot = {
  filterPreset: DateFilterPreset;
  customFromIso: string | null;
  customToIso: string | null;
  claimFilter: "All" | "Claimed" | "Unclaimed";
  advLoadingSite: string;
  advDestinationSite: string;
  advAmount: string;
  advRoadExpence: string;
  advVolume: "" | "MCUBE10" | "MCUBE16";
  advApproved: "" | "PENDING" | "APPROVED" | "DECLINED";
  advCompanyId: string;
};

export async function writeOpenFiltersDraft(snapshot: AdminTripFiltersSnapshot): Promise<void> {
  await AsyncStorage.setItem(ADMIN_TRIP_FILTERS_OPEN_KEY, JSON.stringify(snapshot));
}

export async function readOpenFiltersDraft(): Promise<AdminTripFiltersSnapshot | null> {
  const raw = await AsyncStorage.getItem(ADMIN_TRIP_FILTERS_OPEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminTripFiltersSnapshot;
  } catch {
    return null;
  }
}

export async function clearOpenFiltersDraft(): Promise<void> {
  await AsyncStorage.removeItem(ADMIN_TRIP_FILTERS_OPEN_KEY);
}

export async function consumeAppliedFilters(): Promise<AdminTripFiltersSnapshot | null> {
  const raw = await AsyncStorage.getItem(ADMIN_TRIP_FILTERS_APPLY_KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(ADMIN_TRIP_FILTERS_APPLY_KEY);
  try {
    return JSON.parse(raw) as AdminTripFiltersSnapshot;
  } catch {
    return null;
  }
}

export async function writeAppliedFilters(snapshot: AdminTripFiltersSnapshot): Promise<void> {
  await AsyncStorage.setItem(ADMIN_TRIP_FILTERS_APPLY_KEY, JSON.stringify(snapshot));
}

/**
 * Company Service API
 * -------------------
 * Handles REST actions for contracted Companies endpoints.
 */

import { apiFetch } from "./config";
import {
  Company,
  AddCompanyPayload,
  RegisterPaymentPayload,
  UpdateCompanyPaymentPayload,
  TruckCompanyBalance,
} from "@/src/types/company.types";
import type { Trip } from "@/src/types/trip.types";

export type ClaimCompanyTripItem = { id: string; amount: number; truckId: string };

export type CompanyTripsMoneyWorthPageResult = {
  meta: { page: number; perPage: number; totalPages: number; totalItems: number };
  trips: Trip[];
  allMatchingTripIds: string[];
  amountByTripId: Record<string, number>;
  truckIdByTripId: Record<string, string>;
};

function mapApiCreditTripRow(row: any): Trip {
  const id = String(row?.id ?? row?.tripId ?? "");
  const driverNameRaw = row?.driver?.name ?? row?.driverName ?? row?.driver_name;
  const driverName =
    driverNameRaw !== undefined && driverNameRaw !== null ? String(driverNameRaw).trim() : "";
  const driver =
    driverName.length > 0
      ? {
          id: String(row?.driver?.id ?? row?.driverId ?? row?.driver_id ?? ""),
          name: driverName,
        }
      : undefined;

  const vol = row?.volume;
  const volume: "MCUBE10" | "MCUBE16" = vol === "MCUBE16" || vol === "MCUBE10" ? vol : "MCUBE10";

  const approvedRaw = row?.approved ?? row?.approvalStatus;
  const approved: "PENDING" | "APPROVED" | "DECLINED" | undefined =
    approvedRaw === "PENDING" || approvedRaw === "APPROVED" || approvedRaw === "DECLINED"
      ? approvedRaw
      : "APPROVED";

  return {
    id,
    date: String(row?.date ?? row?.tripDate ?? row?.createdAt ?? new Date().toISOString()),
    loadingSite: String(row?.loadingSite ?? row?.loading_site ?? ""),
    destinationSite: String(row?.destinationSite ?? row?.destination_site ?? ""),
    volume,
    paymentMethod: "CREDIT",
    amount: Number(row?.amount ?? row?.money ?? 0),
    roadExpence: Number(row?.roadExpence ?? row?.road_expence ?? row?.roadExpense ?? 0),
    truckId: String(row?.truckId ?? row?.truck_id ?? ""),
    driverId: String(row?.driverId ?? row?.driver_id ?? row?.driver?.id ?? ""),
    companyId: row?.companyId != null ? String(row.companyId) : undefined,
    driver,
    truck: undefined,
    approved,
    claimed: Boolean(row?.claimed),
    createdAt: String(row?.createdAt ?? row?.date ?? ""),
    updatedAt: String(row?.updatedAt ?? row?.date ?? ""),
  };
}

function parseCompanyTripsMoneyWorthResponse(
  data: any,
  fallbackPage: number,
  fallbackPerPage: number
): CompanyTripsMoneyWorthPageResult {
  const root = data?.data ?? data;
  const tripsRaw = Array.isArray(root?.trips)
    ? root.trips
    : Array.isArray(root?.data?.trips)
      ? root.data.trips
      : [];

  const globalRaw = Array.isArray(root?.global)
    ? root.global
    : Array.isArray(root?.data?.global)
      ? root.data.global
      : Array.isArray(root?.globals)
        ? root.globals
        : [];

  const amountByTripId: Record<string, number> = {};
  const truckIdByTripId: Record<string, string> = {};
  const allMatchingTripIds: string[] = [];

  globalRaw.forEach((row: any) => {
    const id = String(row?.id ?? row?.tripId ?? "");
    if (!id) return;
    allMatchingTripIds.push(id);
    amountByTripId[id] = Number(row?.amount ?? row?.money ?? 0);
    truckIdByTripId[id] = String(row?.truckId ?? row?.truck_id ?? "");
  });

  const trips = tripsRaw.map(mapApiCreditTripRow);

  if (allMatchingTripIds.length === 0 && trips.length > 0) {
    trips.forEach((t) => {
      if (!t.id) return;
      allMatchingTripIds.push(t.id);
      amountByTripId[t.id] = Number(t.amount ?? 0);
      truckIdByTripId[t.id] = String(t.truckId ?? "");
    });
  }

  const metaRaw = root?.meta ?? root?.pagination ?? data?.meta ?? {};
  const perPage = Number(metaRaw?.perPage ?? metaRaw?.per_page ?? fallbackPerPage) || fallbackPerPage;
  const page = Number(metaRaw?.page ?? metaRaw?.currentPage ?? metaRaw?.current_page ?? fallbackPage) || fallbackPage;
  const metaTotal = metaRaw?.totalItems ?? metaRaw?.total_items;
  let totalItems = Number(metaTotal);
  if (!Number.isFinite(totalItems)) {
    totalItems = allMatchingTripIds.length > 0 ? allMatchingTripIds.length : trips.length;
  }
  const totalPagesRaw = Number(metaRaw?.totalPages ?? metaRaw?.total_pages ?? NaN);
  const totalPages =
    Number.isFinite(totalPagesRaw) && totalPagesRaw > 0
      ? totalPagesRaw
      : Math.max(1, Math.ceil((Number.isFinite(totalItems) ? totalItems : trips.length) / perPage));

  return {
    meta: { page, perPage, totalPages, totalItems: Number.isFinite(totalItems) ? totalItems : trips.length },
    trips,
    allMatchingTripIds,
    amountByTripId,
    truckIdByTripId,
  };
}

function mapCompanyFromApi(company: any): Company {
  return {
    id: String(company?.id || ""),
    name: String(company?.name || "Unnamed Company"),
    adminId: String(company?.adminId || ""),
    totalBalance: Number(company?.totalBalance ?? 0),
    currentBalance: Number(company?.currentBalance ?? 0),
    createdAt: String(company?.createdAt || ""),
    updatedAt: String(company?.updatedAt || ""),
    allowedTrucks: Array.isArray(company?.allowedTrucks) ? company.allowedTrucks : [],
  };
}

function parseCompaniesPayload(data: any): any[] {
  if (Array.isArray(data?.companies)) return data.companies;
  if (Array.isArray(data?.data?.companies)) return data.data.companies;
  if (Array.isArray(data)) return data;
  return [];
}

function parseTruckCompanyBalancePayload(body: any): TruckCompanyBalance {
  const root = body?.data ?? body?.info ?? body?.result ?? body;
  const current = Number(
    root?.currentBalance ??
      root?.current_balance ??
      root?.truckCompanyBalance ??
      root?.balance ??
      0
  );
  const total = Number(
    root?.totalBalance ?? root?.total_balance ?? root?.total ?? (Number.isFinite(current) ? current : 0)
  );
  return {
    currentBalance: Number.isFinite(current) ? current : 0,
    totalBalance: Number.isFinite(total) ? total : 0,
  };
}

export const companyService = {
  /**
   * Get contracted companies (optional pagination / single-company filter).
   */
  async getCompanies(opts?: { page?: number; perPage?: number; companyId?: string }): Promise<Company[]> {
    const q = new URLSearchParams();
    if (opts?.page != null) q.set("page", String(opts.page));
    if (opts?.perPage != null) q.set("perPage", String(opts.perPage));
    if (opts?.companyId) q.set("companyId", opts.companyId);
    const qs = q.toString();
    const path = qs ? `/company/get-companies?${qs}` : "/company/get-companies";

    const res = await apiFetch(path);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch companies");
    }
    const data = await res.json();
    return parseCompaniesPayload(data).map(mapCompanyFromApi);
  },

  /** One company by id (uses get-companies filter). */
  async getCompanyById(companyId: string): Promise<Company | null> {
    const list = await this.getCompanies({ companyId, page: 1, perPage: 50 });
    return list.find((c) => c.id === companyId) ?? null;
  },

  /** Per-truck balances for a company assignment. */
  async getTruckCompanyInfo(truckId: string, companyId: string): Promise<TruckCompanyBalance> {
    const res = await apiFetch(
      `/company/get-truck-company-info/${encodeURIComponent(truckId)}/${encodeURIComponent(companyId)}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch truck balance");
    }
    const data = await res.json();
    return parseTruckCompanyBalancePayload(data);
  },

  /**
   * Add a new contracted company (Admin only)
   */
  async addCompany(payload: AddCompanyPayload): Promise<Company> {
    const res = await apiFetch("/company/add-contracted-company", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to define company");
    }
    const data = await res.json();
    const raw = data?.company ?? data;
    return mapCompanyFromApi(raw);
  },

  /**
   * Link a truck to a company (Admin only)
   */
  async addTruckToCompany(companyId: string, truckId: string): Promise<Company> {
    const res = await apiFetch(`/company/add-truck-to-company?companyId=${companyId}&truckId=${truckId}`, {
      method: "PUT",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to assign truck");
    }
    const data = await res.json();
    const raw = data?.company ?? data;
    return mapCompanyFromApi(raw);
  },

  /**
   * Remove a truck from a company (Admin only)
   */
  async removeTruckFromCompany(companyId: string, truckId: string): Promise<Company> {
    const res = await apiFetch(`/company/remove-truck-from-company?companyId=${companyId}&truckId=${truckId}`, {
      method: "PUT",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to remove truck");
    }
    const data = await res.json();
    const raw = data?.company ?? data;
    return mapCompanyFromApi(raw);
  },

  /**
   * Register a received payment and decrement balance (Admin only)
   */
  async registerPayment(payload: RegisterPaymentPayload): Promise<any> {
    const res = await apiFetch("/company/register-payment", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to register payment");
    }
    return res.json();
  },

  /**
   * Update a received company payment (Admin only)
   */
  async updateCompanyPayment(paymentId: string, payload: UpdateCompanyPaymentPayload): Promise<any> {
    const res = await apiFetch(`/company/update-company-payment?paymentId=${encodeURIComponent(paymentId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update payment");
    }
    return res.json();
  },

  /**
   * Get payments for a company
   */
  async getCompanyPayments(companyId: string): Promise<any[]> {
    const res = await apiFetch(`/company/company-payments?companyId=${companyId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch company payments");
    }
    const data = await res.json();
    return Array.isArray(data?.payments) ? data.payments : Array.isArray(data) ? data : [];
  },

  /**
   * Delete a company (Admin only)
   */
  async deleteCompany(id: string): Promise<void> {
    const res = await apiFetch(`/company/delete-company/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete company");
    }
  },

  /**
   * Unclaimed approved credit trips that fit within a budget (paginated + global id list).
   */
  async getCompanyTripsByMoneyWorth(params: {
    companyId: string;
    moneyWorth: number;
    truckIds?: string[];
    page?: number;
    perPage?: number;
  }): Promise<CompanyTripsMoneyWorthPageResult> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 10;
    const body: Record<string, unknown> = {
      companyId: params.companyId,
      moneyWorth: params.moneyWorth,
      page,
      perPage,
    };
    if (params.truckIds && params.truckIds.length > 0) {
      body.truckIds = params.truckIds;
    }

    const res = await apiFetch("/company/get-company-trips-by-money-worth", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to load company trips");
    }
    const data = await res.json();
    return parseCompanyTripsMoneyWorthResponse(data, page, perPage);
  },

  /** Claim credit trips and update balances. */
  async claimCompanyTrips(companyId: string, trips: ClaimCompanyTripItem[]): Promise<void> {
    const res = await apiFetch("/company/claim-company-trips", {
      method: "POST",
      body: JSON.stringify({ companyId, trips }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to claim trips");
    }
  },
};

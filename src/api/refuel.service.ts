import { apiFetch } from "./config";
import { Refuel, GetRefuelsParams } from "../types/refuel.types";

export const refuelService = {
  async getRefuels(params: GetRefuelsParams) {
    const searchParams = new URLSearchParams();
    
    if (params.page !== undefined) searchParams.append("page", params.page.toString());
    if (params.perpage !== undefined) searchParams.append("perpage", params.perpage.toString());
    if (params.truckId) searchParams.append("truckId", params.truckId);
    if (params.startDate) searchParams.append("startDate", params.startDate);
    if (params.endDate) searchParams.append("endDate", params.endDate);
    if (params.approved) searchParams.append("approved", params.approved);
    if (params.litersFrom !== undefined) searchParams.append("litersFrom", params.litersFrom.toString());
    
    // TEMPORARY FIX: Bypass the backend Prisma crash (missing lte) by injecting a huge number
    searchParams.append("litersTo", params.litersTo !== undefined ? params.litersTo.toString() : "999999999");
    
    if (params.priceFrom !== undefined) searchParams.append("priceFrom", params.priceFrom.toString());
    
    searchParams.append("priceTo", params.priceTo !== undefined ? params.priceTo.toString() : "999999999");

    if (params.driverId) searchParams.append("driverId", params.driverId);
    if (params.location) searchParams.append("location", params.location);
    if (params.km !== undefined) searchParams.append("km", params.km.toString());
    if (params.fullTank !== undefined) searchParams.append("fullTank", params.fullTank.toString());

    const qs = searchParams.toString();
    const url = `/refuel/get-refuels${qs ? `?${qs}` : ""}`;
    
    // Note: Documentation says "refules" array property in response
    const res = await apiFetch(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch refuels");
    }
    const data = await res.json();
    return {
      refuels: (data.refules || data.refuels || []) as Refuel[],
      meta: data.meta || { currentPage: 1, totalPages: 1, totalItems: 0 }
    };
  },

  async registerRefuel(payload: { liters: number; price: number; date: string; receiptPic?: string[]; location?: string; km?: number; fullTank?: boolean }) {
    const res = await apiFetch("/refuel/refuel", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to register refuel");
    }
    return res.json();
  },

  async updateRefuel(id: string, payload: { liters?: number; price?: number; date?: string; location?: string; km?: number; fullTank?: boolean }) {
    const res = await apiFetch(`/refuel/update-refuel/${id}`, {
      method: "POST", // API doc says POST for update
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update refuel");
    }
    return res.json();
  },

  async approveRefuel(id: string) {
    const res = await apiFetch(`/refuel/approve-refuel/${id}`, {
      method: "PUT",
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to approve refuel");
    }
    return res.json();
  }
};

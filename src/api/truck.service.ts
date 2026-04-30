/**
 * Truck Service API
 */
import { apiFetch } from "./config";
import { Truck } from "@/src/types";

export const truckService = {
  async getMyTrucks(): Promise<{ trucks: Truck[] }> {
    const res = await apiFetch("/admin/trucks/my-trucks");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.message && String(err.message).toLowerCase().includes("no trucks")) {
        return { trucks: [] };
      }
      throw new Error(err.message || "Failed to fetch trucks");
    }
    const data = await res.json();
    return data;
  },

  async addTruck(payload: { plateNumber: string; vinNumber: string }): Promise<{ message: string; truck: Truck }> {
    const res = await apiFetch("/admin/trucks/add-truck", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to add truck");
    }
    return res.json();
  }
};

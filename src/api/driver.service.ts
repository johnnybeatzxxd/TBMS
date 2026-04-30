/**
 * Driver Service API
 */
import { apiFetch } from "./config";
import { Driver } from "@/src/types";

export const driverService = {
  async getMyDrivers(): Promise<{ drivers: Driver[] }> {
    const res = await apiFetch("/admin/my-drivers");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.message && String(err.message).toLowerCase().includes("no driver")) {
        return { drivers: [] };
      }
      throw new Error(err.message || "Failed to fetch drivers");
    }
    const data = await res.json();
    return data;
  },

  async createDriverAccount(payload: any): Promise<{ driver: Driver }> {
    const res = await apiFetch("/admin/driver-account/create-driver-account", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create driver account");
    }
    return res.json();
  },

  async deactivateDriver(id: string): Promise<void> {
    const res = await apiFetch(`/admin/driver-account/deactivate-driver-account/${id}`, { method: "PUT" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to deactivate driver");
    }
  },

  async activateDriver(id: string): Promise<void> {
    const res = await apiFetch(`/admin/driver-account/activate-driver-account/${id}`, { method: "PUT" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to activate driver");
    }
  },

  async deleteDriver(id: string): Promise<void> {
    const res = await apiFetch(`/admin/driver-account/delete-driver-account/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete driver");
    }
  },

  async assignTruck(id: string, truckId: string): Promise<void> {
    const res = await apiFetch(`/admin/driver-account/update-driver-profile/${id}`, {
      method: "POST",
      body: JSON.stringify({ truckId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to assign truck");
    }
  }
};

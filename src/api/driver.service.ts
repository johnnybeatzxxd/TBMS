/**
 * Driver Service API
 */
import { Driver } from "@/src/types";
import { apiFetch } from "./config";

export const driverService = {
  async getDriverProfile(id: string): Promise<{ driver: Driver }> {
    const res = await apiFetch(`/admin/driver-account/get-driver-profile/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch driver profile");
    }
    return res.json();
  },

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

  async updateDriverProfile(id: string, payload: { truckId?: string; licenceExpiryDate?: string; name?: string }): Promise<void> {
    console.log("[DriverService] updateDriverProfile URL:", `/admin/driver-account/update-driver-profile/${id}`);
    console.log("[DriverService] updateDriverProfile body:", JSON.stringify(payload));
    const res = await apiFetch(`/admin/driver-account/update-driver-profile/${id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.log("[DriverService] updateDriverProfile error response:", res.status, JSON.stringify(err));
      throw new Error(err.message || "Failed to update driver profile");
    }
  },

  async resetDriverCredentials(id: string, payload: { username?: string; password?: string }): Promise<void> {
    console.log("[DriverService] resetDriverCredentials URL:", `/admin/driver-account/reset-driver-credentials/${id}`);
    console.log("[DriverService] resetDriverCredentials body:", JSON.stringify(payload));
    const res = await apiFetch(`/admin/driver-account/reset-driver-credentials/${id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.log("[DriverService] resetDriverCredentials error response:", res.status, JSON.stringify(err));
      throw new Error(err.message || "Failed to reset driver credentials");
    }
  }
};

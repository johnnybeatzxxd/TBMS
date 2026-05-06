import { apiFetch } from "./config";
import { RollingDisplay, AddDisplayPayload, UpdateDisplayPayload } from "../types/display.types";

export const displayService = {
  // Shared
  async getRollingDisplays(): Promise<{ displays: RollingDisplay[] }> {
    const res = await apiFetch("/display/get-rolling-displays");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch rolling displays");
    }
    return res.json();
  },

  // Admin
  async addDisplay(payload: AddDisplayPayload): Promise<void> {
    const res = await apiFetch("/display/add-rolling-display", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create rolling display");
    }
  },

  async updateDisplay(id: string, payload: UpdateDisplayPayload): Promise<void> {
    const res = await apiFetch(`/display/update-rolling-display/${id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update display");
    }
  },

  async toggleDisplay(id: string): Promise<void> {
    const res = await apiFetch(`/display/toggle-rolling-display/${id}`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to toggle display active status");
    }
  },

  async deleteDisplay(id: string): Promise<void> {
    const res = await apiFetch(`/display/delete-rolling-display/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete rolling display");
    }
  },

  async addDriverToDisplay(id: string, driverId: string): Promise<void> {
    const res = await apiFetch(`/display/add-driver-to-display/${id}`, {
      method: "POST",
      body: JSON.stringify({ driverId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to link driver");
    }
  },

  async removeDriverFromDisplay(id: string, driverId: string): Promise<void> {
    const res = await apiFetch(`/display/remove-driver-from-display/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ driverId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to unlink driver");
    }
  }
};

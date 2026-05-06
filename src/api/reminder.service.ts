import { apiFetch } from "./config";
import { Reminder, AddReminderPayload, UpdateReminderPayload, GetRemindersFilters } from "../types/reminder.types";

export const reminderService = {
  // ------------------------------------
  // DRIVER ENDPOINTS
  // ------------------------------------
  
  async getPendingRemindersDriver(): Promise<{ pending: Reminder[] }> {
    const res = await apiFetch("/reminder/pending");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch pending driver reminders");
    }
    return res.json();
  },

  async getAllRemindersDriver(): Promise<{ reminders: Reminder[] }> {
    const res = await apiFetch("/reminder/all");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch all driver reminders");
    }
    return res.json();
  },

  // ------------------------------------
  // ADMIN ENDPOINTS
  // ------------------------------------

  async getReminders(filters?: GetRemindersFilters): Promise<{ reminders: Reminder[] }> {
    const queryParams = new URLSearchParams();
    if (filters?.reminderName) queryParams.append("reminderName", filters.reminderName);
    if (filters?.reminderActive !== undefined) queryParams.append("reminderActive", String(filters.reminderActive));
    if (filters?.reminderType) queryParams.append("reminderType", filters.reminderType);
    if (filters?.frequency) queryParams.append("frequency", filters.frequency);

    const queryString = queryParams.toString();
    const url = `/admin/reminders/get-reminders${queryString ? `?${queryString}` : ""}`;
    
    const res = await apiFetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch all reminders");
    }
    return res.json();
  },

  async getPendingRemindersAdmin(): Promise<{ pending: Reminder[] }> {
    const res = await apiFetch("/admin/reminders/get-pending-reminders");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // In case no pending gives back an error message we can just assume [] natively
      throw new Error(err.message || "Failed to fetch pending admin reminders");
    }
    return res.json();
  },

  async addReminder(payload: AddReminderPayload): Promise<void> {
    const res = await apiFetch("/admin/reminders/add-reminder", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create reminder");
    }
  },

  async updateReminder(id: string, payload: UpdateReminderPayload): Promise<void> {
    const res = await apiFetch(`/admin/reminders/update-reminder/${id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update reminder");
    }
  },

  async toggleReminder(id: string): Promise<void> {
    const res = await apiFetch(`/admin/reminders/toggle-reminder/${id}`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to toggle reminder");
    }
  },

  async addDriverToReminder(id: string, driverId: string): Promise<void> {
    const res = await apiFetch(`/admin/reminders/add-driver-to-reminder/${id}`, {
      method: "POST",
      body: JSON.stringify({ driverId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to link driver");
    }
  },

  async removeDriverFromReminder(id: string, driverId: string): Promise<void> {
    // Assuming deleting requires body or simply hitting endpoint
    const res = await apiFetch(`/admin/reminders/remove-driver-from-reminder/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ driverId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to unlink driver");
    }
  },

  async deleteReminder(id: string): Promise<void> {
    const res = await apiFetch(`/admin/reminders/delete-reminder/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete reminder");
    }
  }
};

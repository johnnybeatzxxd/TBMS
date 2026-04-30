/**
 * Company Service API
 * -------------------
 * Handles REST actions for contracted Companies endpoints.
 */

import { apiFetch } from "./config";
import { 
  Company, 
  AddCompanyPayload, 
  RegisterPaymentPayload 
} from "@/src/types/company.types";

export const companyService = {
  /**
   * Get all contracted companies available to the admin
   */
  async getCompanies(): Promise<Company[]> {
    const res = await apiFetch("/company/companies");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch companies");
    }
    const data = await res.json();
    return data.companies || data;
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
    return data.company || data;
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
    return data.company || data;
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
    return data.company || data;
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
};

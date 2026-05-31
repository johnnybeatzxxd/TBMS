import { apiFetch } from "./config";
import {
  FinancialCommitment,
  CreateFinancialCommitmentPayload,
  FinancialCommitmentsResponse,
} from "@/src/types";

export const financialCommitmentService = {
  /**
   * GET /financialComitments
   * Retrieve all commitments for the authenticated admin
   */
  async getCommitments(): Promise<FinancialCommitmentsResponse> {
    const res = await apiFetch("/financialComitments");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch financial commitments");
    }
    return res.json();
  },

  /**
   * POST /financialComitments
   * Create a new financial commitment
   */
  async createCommitment(payload: CreateFinancialCommitmentPayload): Promise<{ message: string; data: FinancialCommitment }> {
    const res = await apiFetch("/financialComitments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create financial commitment");
    }
    return res.json();
  },

  /**
   * PUT /financialComitments/:id
   * Update an existing commitment
   */
  async updateCommitment(id: string, payload: Partial<CreateFinancialCommitmentPayload>): Promise<{ message: string; data: FinancialCommitment }> {
    const res = await apiFetch(`/financialComitments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update financial commitment");
    }
    return res.json();
  },

  /**
   * DELETE /financialComitments/:id
   * Remove a commitment
   */
  async deleteCommitment(id: string): Promise<{ message: string }> {
    const res = await apiFetch(`/financialComitments/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete financial commitment");
    }
    return res.json();
  },
};

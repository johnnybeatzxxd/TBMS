/**
 * Expense Service API
 * --------------------
 * Real API service for general expenses (not service requests).
 * Maps to POST /expences/expence endpoint.
 */

import { apiFetch } from "./config";
import { Expense, AddExpensePayload, ExpenseFilters } from "@/src/types/expense.types";

export const expenseService = {
  /**
   * POST /expences/get-expences
   * Fetch expenses for the current user. The backend automatically
   * filters by the driver's truckId when the caller is a driver.
   */
  async getMyExpenses(filters?: ExpenseFilters): Promise<{ expenses: Expense[] }> {
    console.log("Expense Filter Payload Sent to API:", filters);
    const res = await apiFetch("/expences/get-expences", {
      method: "POST",
      body: JSON.stringify(filters || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch expenses");
    }
    const data = await res.json();
    return { expenses: data.expences || [] };
  },

  /**
   * POST /expences/expence
   * Register a general expense (Driver).
   */
  async addExpense(truckId: string, payload: Omit<AddExpensePayload, "truckId">): Promise<{ message: string }> {
    const requestBody: Record<string, unknown> = {
      amount: payload.price,
      remark: payload.remark,
      date: payload.date,
    };
    if (payload.serviceTypeId) requestBody.serviceTypeId = payload.serviceTypeId;
    if (payload.serviceRequestId) requestBody.serviceRequestId = payload.serviceRequestId;
    if (payload.dynamicData) requestBody.dynamicData = payload.dynamicData;
    if (payload.receiptPic) requestBody.receiptPic = payload.receiptPic;
    if (payload.tag) requestBody.tag = payload.tag;

    const res = await apiFetch("/expences/expence", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to register expense");
    }
    const data = await res.json();
    return { message: data.message || "Expense registered successfully" };
  },

  /**
   * POST /expences/expence — driver "Other" request (remark + optional receipt only).
   */
  async addOtherExpense(payload: {
    amount: number;
    date: string;
    remark?: string;
    receiptPic?: string;
  }): Promise<{ message: string }> {
    const body: Record<string, unknown> = {
      amount: payload.amount,
      date: payload.date,
    };
    if (payload.remark?.trim()) body.remark = payload.remark.trim();
    if (payload.receiptPic) body.receiptPic = payload.receiptPic;

    const res = await apiFetch("/expences/expence", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to register expense");
    }
    const data = await res.json();
    return { message: data.message || "Expense registered successfully" };
  },

  /**
   * GET /expences/get-service-request-names
   * Fetch the list of forms / service request types
   */
  async getServiceRequestNames(): Promise<{ serviceTypes: { id: string, name: string }[] }> {
    console.log("Calling /expences/get-service-request-names");
    const res = await apiFetch("/expences/get-service-request-names", {
      method: "GET",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Failed to fetch service request names:", err);
      throw new Error(err.message || "Failed to fetch service request names");
    }
    const data = await res.json();
    console.log("Service Request Names Response:", data);
    return data;
  },
};

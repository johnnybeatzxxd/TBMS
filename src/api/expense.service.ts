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
    const requestBody = {
      amount: payload.price,
      remark: payload.remark,
      date: payload.date,
      serviceTypeId: payload.serviceTypeId,
      serviceRequestId: payload.serviceRequestId,
      dynamicData: payload.dynamicData,
      receiptPic: payload.receiptPic,
      tag: payload.tag,
    };
    console.log("Submit Expense Payload:", JSON.stringify(requestBody, null, 2));

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
};

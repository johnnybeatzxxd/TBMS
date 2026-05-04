import { apiFetch } from "./config";
import { Transfer, AddTransferPayload } from "@/src/types/transfer.types";

export const transferService = {
  // GET money-transfer list with pagination and driver/admin filters
  async getTransfers(params: {
    page?: number;
    perpage?: number;
    driverId?: string;
    adminId?: string;
    sender?: "ADMIN" | "DRIVER";
    dateFrom?: string;
    dateTo?: string;
    amountFrom?: number;
    amountTo?: number;
  } = {}): Promise<{ transfers: Transfer[]; meta: any }> {
    const queryParams: string[] = [];
    if (params.page) queryParams.push(`page=${params.page}`);
    if (params.perpage) queryParams.push(`perpage=${params.perpage}`);
    if (params.driverId) queryParams.push(`driverId=${params.driverId}`);
    if (params.adminId) queryParams.push(`adminId=${params.adminId}`);
    if (params.sender) queryParams.push(`sender=${params.sender}`);
    if (params.dateFrom) queryParams.push(`dateFrom=${params.dateFrom}`);
    if (params.dateTo) queryParams.push(`dateTo=${params.dateTo}`);
    if (params.amountFrom !== undefined) queryParams.push(`amountFrom=${params.amountFrom}`);

    // TEMPORARY FIX: Bypass the backend Prisma crash (missing lte) by injecting a huge number
    queryParams.push(`amountTo=${params.amountTo !== undefined ? params.amountTo : 999999999}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

    const res = await apiFetch(`/money-transfer/transfer-history${queryString}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to load money transfers");
    }
    return res.json();
  },

  // POST new money transfer
  async addTransfer(payload: AddTransferPayload): Promise<{ message: string; newTransfer: Transfer; newDriverBalance: number }> {
    const res = await apiFetch("/money-transfer/transfer-money", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to register money transfer");
    }
    return res.json();
  },

  // PUT: Approve pending money transfer
  async approveTransfer(id: string): Promise<{ message: string; updatedTransfer: Transfer; newDriverBalance: number }> {
    const res = await apiFetch(`/money-transfer/approve-money-transfer/${id}`, {
      method: "PUT",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to approve money transfer");
    }
    return res.json();
  },

  // DELETE a money transfer
  async deleteTransfer(id: string): Promise<{ message: string; deletedTransfer: Transfer; driverBalance: number }> {
    const res = await apiFetch(`/money-transfer/delete-money-transfer/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete money transfer");
    }
    return res.json();
  },
};

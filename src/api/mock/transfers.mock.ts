import { Transfer, AddTransferPayload } from "@/src/types/transfer.types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_TRANSFERS: Transfer[] = [
  {
    id: "tx_001",
    driverId: "drv_001",
    amount: 1500,
    type: "increment",
    remark: "Advance payment for fuel and tolls",
    date: "2026-04-20",
  },
  {
    id: "tx_002",
    driverId: "drv_001",
    amount: 300,
    type: "decrement",
    remark: "Deduction for previous toll fees",
    date: "2026-04-22",
  },
  {
    id: "tx_003",
    driverId: "drv_002",
    amount: 2000,
    type: "increment",
    remark: "Monthly bonus for performance",
    date: "2026-04-23",
  },
  {
    id: "tx_004",
    driverId: "drv_001",
    amount: 50,
    type: "decrement",
    remark: "Parking fine reimbursement",
    date: "2026-04-24",
  },
  {
    id: "tx_005",
    driverId: "drv_002",
    amount: 120,
    type: "decrement",
    remark: "Service fee deduction",
    date: "2026-04-25",
  },
  {
    id: "tx_006",
    driverId: "drv_001",
    amount: 800,
    type: "increment",
    remark: "Weekly allowance",
    date: "2026-04-25",
  },
];

export const mockTransferService = {
  // GET mock transfers list
  async getTransfers(): Promise<{ transfers: Transfer[] }> {
    await delay(600);
    // Returning latest first
    return { transfers: [...MOCK_TRANSFERS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
  },

  // POST new transfer
  async addTransfer(payload: AddTransferPayload): Promise<{ message: string; transfer: Transfer }> {
    await delay(600);
    
    const newTransfer: Transfer = {
      id: `tx_${Date.now()}`,
      driverId: payload.driverId,
      amount: payload.amount,
      type: payload.type,
      remark: payload.remark,
      date: payload.date,
    };
    
    MOCK_TRANSFERS.push(newTransfer);
    return { message: "transfer registered successfully", transfer: newTransfer };
  },
};

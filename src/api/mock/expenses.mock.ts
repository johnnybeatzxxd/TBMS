import { Expense, AddExpensePayload } from "@/src/types/expense.types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_EXPENSES: Expense[] = [
  {
    id: "exp_001",
    truckId: "trk_101",
    remark: "Refuel - 120 Liters | Desc: Weekly refuel at Shell station",
    price: 350.5,
    date: "2026-04-20",
  },
  {
    id: "exp_002",
    truckId: "trk_101",
    remark: "Maintenance - Oil (150000 K/m) | Desc: Changed synthetic oil and filter",
    price: 85,
    date: "2026-04-22",
  },
  {
    id: "exp_003",
    truckId: "trk_101",
    remark: "Other | Desc: Required truck wash",
    price: 25,
    date: "2026-04-23",
  },
  {
    id: "exp_004",
    truckId: "trk_101",
    remark: "Maintenance - Tires | Desc: Replaced front-left tire after puncture",
    price: 250,
    date: "2026-04-24",
  },
  {
    id: "exp_005",
    truckId: "trk_101",
    remark: "Refuel - 50 Liters | Desc: Top up on interstate",
    price: 155,
    date: "2026-04-25",
  },
];

export const mockExpenseService = {
  // GET mock expenses for UI
  async getMyExpenses(): Promise<{ expenses: Expense[] }> {
    await delay(600);
    // Returning latest first
    return { expenses: [...MOCK_EXPENSES].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
  },

  // POST /expences/expence/:id
  async addExpense(truckId: string, payload: Omit<AddExpensePayload, "truckId">): Promise<{ message: string }> {
    await delay(600);
    
    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      truckId,
      remark: payload.remark,
      price: payload.price,
      date: payload.date,
    };
    
    MOCK_EXPENSES.push(newExpense);
    return { message: "refule registered successfully" };
  },
};

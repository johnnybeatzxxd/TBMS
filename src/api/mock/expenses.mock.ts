import { Expense, AddExpensePayload } from "@/src/types/expense.types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_EXPENSES: Expense[] = [
  {
    id: "exp_001",
    truckId: "trk_101",
    remark: "Fuel refill at Shell",
    price: 300,
    date: "2026-04-20",
  },
  {
    id: "exp_002",
    truckId: "trk_101",
    remark: "Toll fee",
    price: 15,
    date: "2026-04-22",
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

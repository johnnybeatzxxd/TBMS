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
  {
    id: "exp_006",
    truckId: "trk_101",
    remark: "Road Expense | Desc: Toll gate fee",
    price: 45,
    date: "2026-04-26",
  },
  { id: "exp_007", truckId: "trk_102", remark: "Refuel - 80 Liters | Desc: Gas up at Total", price: 210, date: "2026-04-19" },
  { id: "exp_008", truckId: "trk_101", remark: "Maintenance - Lights | Desc: Fixed tail lights", price: 30, date: "2026-04-18" },
  { id: "exp_009", truckId: "trk_102", remark: "Road Expense | Desc: Highway toll", price: 15, date: "2026-04-17" },
  { id: "exp_010", truckId: "trk_101", remark: "Other | Desc: Parking fee", price: 10, date: "2026-04-16" },
  { id: "exp_011", truckId: "trk_102", remark: "Maintenance - Battery | Desc: Replaced battery", price: 120, date: "2026-04-15" },
  { id: "exp_012", truckId: "trk_101", remark: "Refuel - 100 Liters | Desc: Weekly fuel", price: 300, date: "2026-04-14" },
  { id: "exp_013", truckId: "trk_102", remark: "Road Expense | Desc: Bridge toll", price: 25, date: "2026-04-13" },
  { id: "exp_014", truckId: "trk_101", remark: "Maintenance - Brakes | Desc: Pad replacement", price: 180, date: "2026-04-12" },
  { id: "exp_015", truckId: "trk_102", remark: "Other | Desc: Truck wash", price: 20, date: "2026-04-11" },
  { id: "exp_016", truckId: "trk_101", remark: "Refuel - 40 Liters | Desc: Trip top up", price: 120, date: "2026-04-10" },
  { id: "exp_017", truckId: "trk_102", remark: "Road Expense | Desc: Express way fee", price: 50, date: "2026-04-09" },
  { id: "exp_018", truckId: "trk_101", remark: "Maintenance - Filter | Desc: Air filter change", price: 40, date: "2026-04-08" },
  { id: "exp_019", truckId: "trk_102", remark: "Other | Desc: Warehouse entry fee", price: 15, date: "2026-04-07" },
  { id: "exp_020", truckId: "trk_101", remark: "Refuel - 90 Liters | Desc: Long haul refuel", price: 270, date: "2026-04-06" },
  { id: "exp_021", truckId: "trk_102", remark: "Other | Desc: Toll fee", price: 10, date: "2026-04-05" },
  { id: "exp_022", truckId: "trk_101", remark: "Maintenance - Oil | Desc: Routine check", price: 50, date: "2026-04-04" },
  { id: "exp_023", truckId: "trk_102", remark: "Refuel - 50 Liters | Desc: Quick fill", price: 150, date: "2026-04-03" },
  { id: "exp_024", truckId: "trk_101", remark: "Road Expense | Desc: Highway pass", price: 20, date: "2026-04-02" },
  { id: "exp_025", truckId: "trk_102", remark: "Other | Desc: Bridge fee", price: 5, date: "2026-04-01" },
  { id: "exp_026", truckId: "trk_101", remark: "Maintenance - Wash | Desc: Monthly cleaning", price: 30, date: "2026-03-31" },
  { id: "exp_027", truckId: "trk_102", remark: "Refuel - 70 Liters | Desc: Full tank", price: 210, date: "2026-03-30" },
  { id: "exp_028", truckId: "trk_101", remark: "Road Expense | Desc: City toll", price: 10, date: "2026-03-29" },
  { id: "exp_029", truckId: "trk_102", remark: "Other | Desc: Parking", price: 15, date: "2026-03-28" },
  { id: "exp_030", truckId: "trk_101", remark: "Maintenance - Lights | Desc: Bulb replacement", price: 20, date: "2026-03-27" },
  { id: "exp_031", truckId: "trk_102", remark: "Refuel - 60 Liters | Desc: Regular refuel", price: 180, date: "2026-03-26" },
  { id: "exp_032", truckId: "trk_101", remark: "Road Expense | Desc: Tunnel fee", price: 12, date: "2026-03-25" },
  { id: "exp_033", truckId: "trk_102", remark: "Other | Desc: Inspection fee", price: 40, date: "2026-03-24" },
  { id: "exp_034", truckId: "trk_101", remark: "Maintenance - Tires | Desc: Air pressure check", price: 5, date: "2026-03-23" },
  { id: "exp_035", truckId: "trk_102", remark: "Refuel - 80 Liters | Desc: Standard fill", price: 240, date: "2026-03-22" },
  { id: "exp_036", truckId: "trk_101", remark: "Road Expense | Desc: Expressway toll", price: 25, date: "2026-03-21" },
  { id: "exp_037", truckId: "trk_102", remark: "Other | Desc: Storage fee", price: 100, date: "2026-03-20" },
  { id: "exp_038", truckId: "trk_101", remark: "Maintenance - Fluids | Desc: Topped up coolant", price: 15, date: "2026-03-19" },
  { id: "exp_039", truckId: "trk_102", remark: "Refuel - 40 Liters | Desc: Top up", price: 120, date: "2026-03-18" },
  { id: "exp_040", truckId: "trk_101", remark: "Road Expense | Desc: Weigh station fee", price: 8, date: "2026-03-17" },
  { id: "exp_041", truckId: "trk_102", remark: "Other | Desc: Cleaning supplies", price: 20, date: "2026-03-16" },
  { id: "exp_042", truckId: "trk_101", remark: "Maintenance - Engine | Desc: Diagnostic check", price: 75, date: "2026-03-15" },
  { id: "exp_043", truckId: "trk_102", remark: "Refuel - 90 Liters | Desc: Full tank refuel", price: 270, date: "2026-03-14" },
  { id: "exp_044", truckId: "trk_101", remark: "Road Expense | Desc: State line toll", price: 30, date: "2026-03-13" },
  { id: "exp_045", truckId: "trk_102", remark: "Other | Desc: Driver snack", price: 5, date: "2026-03-12" },
  { id: "exp_046", truckId: "trk_101", remark: "Maintenance - Interior | Desc: Seat repair", price: 150, date: "2026-03-11" },
  { id: "exp_047", truckId: "trk_102", remark: "Refuel - 100 Liters | Desc: End of week fill", price: 300, date: "2026-03-10" },
  { id: "exp_048", truckId: "trk_101", remark: "Road Expense | Desc: Bridge crossing", price: 10, date: "2026-03-09" },
  { id: "exp_049", truckId: "trk_102", remark: "Other | Desc: Phone credit", price: 20, date: "2026-03-08" },
  { id: "exp_050", truckId: "trk_101", remark: "Maintenance - Misc | Desc: General fix", price: 40, date: "2026-03-07" },
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

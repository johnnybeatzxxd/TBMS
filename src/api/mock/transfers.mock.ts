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
  { id: "tx_007", driverId: "drv_002", amount: 500, type: "increment", remark: "Trip advance", date: "2026-04-19" },
  { id: "tx_008", driverId: "drv_001", amount: 100, type: "decrement", remark: "Speeding fine", date: "2026-04-18" },
  { id: "tx_009", driverId: "drv_002", amount: 250, type: "increment", remark: "Repair reimbursement", date: "2026-04-17" },
  { id: "tx_010", driverId: "drv_001", amount: 50, type: "decrement", remark: "Lost gear deduction", date: "2026-04-16" },
  { id: "tx_011", driverId: "drv_002", amount: 1200, type: "increment", remark: "Salary payment", date: "2026-04-15" },
  { id: "tx_012", driverId: "drv_001", amount: 300, type: "increment", remark: "Bonus", date: "2026-04-14" },
  { id: "tx_013", driverId: "drv_002", amount: 200, type: "decrement", remark: "Misc deduction", date: "2026-04-13" },
  { id: "tx_014", driverId: "drv_001", amount: 450, type: "increment", remark: "Fuel advance", date: "2026-04-12" },
  { id: "tx_015", driverId: "drv_002", amount: 75, type: "decrement", remark: "Tool replacement", date: "2026-04-11" },
  { id: "tx_016", driverId: "drv_001", amount: 1000, type: "increment", remark: "Project bonus", date: "2026-04-10" },
  { id: "tx_017", driverId: "drv_002", amount: 150, type: "decrement", remark: "Cleaning fee", date: "2026-04-09" },
  { id: "tx_018", driverId: "drv_001", amount: 550, type: "increment", remark: "Travel allowance", date: "2026-04-08" },
  { id: "tx_019", driverId: "drv_002", amount: 30, type: "decrement", remark: "Key replacement", date: "2026-04-07" },
  { id: "tx_020", driverId: "drv_001", amount: 900, type: "increment", remark: "Monthly stipend", date: "2026-04-06" },
  { id: "tx_021", driverId: "drv_002", amount: 100, type: "decrement", remark: "Uniform fee", date: "2026-04-05" },
  { id: "tx_022", driverId: "drv_001", amount: 400, type: "increment", remark: "Fuel card reload", date: "2026-04-04" },
  { id: "tx_023", driverId: "drv_002", amount: 50, type: "decrement", remark: "Minor damage deduction", date: "2026-04-03" },
  { id: "tx_024", driverId: "drv_001", amount: 200, type: "increment", remark: "Weekend work pay", date: "2026-04-02" },
  { id: "tx_025", driverId: "drv_002", amount: 300, type: "increment", remark: "Performance bonus", date: "2026-04-01" },
  { id: "tx_026", driverId: "drv_001", amount: 120, type: "decrement", remark: "Safety gear purchase", date: "2026-03-31" },
  { id: "tx_027", driverId: "drv_002", amount: 800, type: "increment", remark: "Advance for route X", date: "2026-03-30" },
  { id: "tx_028", driverId: "drv_001", amount: 40, type: "decrement", remark: "Toll pass over-usage", date: "2026-03-29" },
  { id: "tx_029", driverId: "drv_002", amount: 1500, type: "increment", remark: "Monthly salary", date: "2026-03-28" },
  { id: "tx_030", driverId: "drv_001", amount: 200, type: "decrement", remark: "Advance deduction", date: "2026-03-27" },
  { id: "tx_031", driverId: "drv_002", amount: 600, type: "increment", remark: "Holiday pay", date: "2026-03-26" },
  { id: "tx_032", driverId: "drv_001", amount: 75, type: "decrement", remark: "Missing log sheet fine", date: "2026-03-25" },
  { id: "tx_033", driverId: "drv_002", amount: 350, type: "increment", remark: "Maintenance reimbursement", date: "2026-03-24" },
  { id: "tx_034", driverId: "drv_001", amount: 90, type: "decrement", remark: "Cleaning fee", date: "2026-03-23" },
  { id: "tx_035", driverId: "drv_002", amount: 1100, type: "increment", remark: "Contract bonus", date: "2026-03-22" },
  { id: "tx_036", driverId: "drv_001", amount: 250, type: "decrement", remark: "Loan repayment", date: "2026-03-21" },
  { id: "tx_037", driverId: "drv_002", amount: 450, type: "increment", remark: "Outstation allowance", date: "2026-03-20" },
  { id: "tx_038", driverId: "drv_001", amount: 20, type: "decrement", remark: "Admin fee", date: "2026-03-19" },
  { id: "tx_039", driverId: "drv_002", amount: 700, type: "increment", remark: "Trip incentive", date: "2026-03-18" },
  { id: "tx_040", driverId: "drv_001", amount: 150, type: "decrement", remark: "Benefit contribution", date: "2026-03-17" },
  { id: "tx_041", driverId: "drv_002", amount: 1300, type: "increment", remark: "Monthly base pay", date: "2026-03-16" },
  { id: "tx_042", driverId: "drv_001", amount: 100, type: "increment", remark: "Referral bonus", date: "2026-03-15" },
  { id: "tx_043", driverId: "drv_002", amount: 60, type: "decrement", remark: "Phone bill deduction", date: "2026-03-14" },
  { id: "tx_044", driverId: "drv_001", amount: 800, type: "increment", remark: "Emergency advance", date: "2026-03-13" },
  { id: "tx_045", driverId: "drv_002", amount: 200, type: "decrement", remark: "Cash shortage correction", date: "2026-03-12" },
  { id: "tx_046", driverId: "drv_001", amount: 500, type: "increment", remark: "Yearly bonus partial", date: "2026-03-11" },
  { id: "tx_047", driverId: "drv_002", amount: 10, type: "decrement", remark: "Service charge", date: "2026-03-10" },
  { id: "tx_048", driverId: "drv_001", amount: 1200, type: "increment", remark: "Regular salary", date: "2026-03-09" },
  { id: "tx_049", driverId: "drv_002", amount: 50, type: "decrement", remark: "Late arrival fine", date: "2026-03-08" },
  { id: "tx_050", driverId: "drv_001", amount: 300, type: "increment", remark: "Safety award", date: "2026-03-07" },
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

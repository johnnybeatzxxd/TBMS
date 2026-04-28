/**
 * Analytics Mock Data
 * Mirrors the Prisma schema structure for easy backend swap later.
 * Each service method simulates an API call with a small delay.
 */

// ─── Types ───────────────────────────────────────────────────────────
export interface AnalyticsTrip {
  id: string;
  date: string; // ISO date
  loadingSite: string;
  destinationSite: string;
  volume: "MCUBE10" | "MCUBE16";
  paymentMethod: "CASH" | "DISPATCH";
  amount: number | null;
  numberOfTrips: number;
  roadExpence: number;
  truckId: string;
}

export interface AnalyticsRefuel {
  id: string;
  date: string;
  price: number;
  vol: number; // liters
  truckId: string;
}

export interface AnalyticsDriverExpense {
  id: string;
  date: string;
  remark: string;
  amount: number;
  truckId: string;
}

// ─── Mock Trips ──────────────────────────────────────────────────────
const MOCK_ANALYTICS_TRIPS: AnalyticsTrip[] = [
  { id: "t1",  date: "2026-04-27", loadingSite: "Addis Ababa",   destinationSite: "Moria",    volume: "MCUBE10", paymentMethod: "CASH",     amount: 4500,  numberOfTrips: 1, roadExpence: 200, truckId: "trk_101" },
  { id: "t2",  date: "2026-04-27", loadingSite: "Dukem",         destinationSite: "Kality",   volume: "MCUBE16", paymentMethod: "DISPATCH", amount: null,  numberOfTrips: 1, roadExpence: 150, truckId: "trk_102" },
  { id: "t3",  date: "2026-04-26", loadingSite: "Sendafa",       destinationSite: "Dukem",    volume: "MCUBE10", paymentMethod: "CASH",     amount: 3800,  numberOfTrips: 2, roadExpence: 300, truckId: "trk_101" },
  { id: "t4",  date: "2026-04-26", loadingSite: "Mexico",        destinationSite: "Moria",    volume: "MCUBE16", paymentMethod: "DISPATCH", amount: null,  numberOfTrips: 1, roadExpence: 100, truckId: "trk_102" },
  { id: "t5",  date: "2026-04-25", loadingSite: "Addis Ababa",   destinationSite: "Sendafa",  volume: "MCUBE10", paymentMethod: "CASH",     amount: 5200,  numberOfTrips: 1, roadExpence: 250, truckId: "trk_101" },
  { id: "t6",  date: "2026-04-25", loadingSite: "Kality",        destinationSite: "Dukem",    volume: "MCUBE16", paymentMethod: "CASH",     amount: 4800,  numberOfTrips: 1, roadExpence: 180, truckId: "trk_102" },
  { id: "t7",  date: "2026-04-24", loadingSite: "Dukem",         destinationSite: "Mexico",   volume: "MCUBE10", paymentMethod: "DISPATCH", amount: null,  numberOfTrips: 1, roadExpence: 120, truckId: "trk_101" },
  { id: "t8",  date: "2026-04-24", loadingSite: "Sendafa",       destinationSite: "Moria",    volume: "MCUBE16", paymentMethod: "CASH",     amount: 6100,  numberOfTrips: 2, roadExpence: 350, truckId: "trk_102" },
  { id: "t9",  date: "2026-04-23", loadingSite: "Addis Ababa",   destinationSite: "Kality",   volume: "MCUBE10", paymentMethod: "CASH",     amount: 3600,  numberOfTrips: 1, roadExpence: 100, truckId: "trk_101" },
  { id: "t10", date: "2026-04-23", loadingSite: "Mexico",        destinationSite: "Sendafa",  volume: "MCUBE16", paymentMethod: "DISPATCH", amount: null,  numberOfTrips: 1, roadExpence: 220, truckId: "trk_102" },
  { id: "t11", date: "2026-04-22", loadingSite: "Dukem",         destinationSite: "Moria",    volume: "MCUBE10", paymentMethod: "CASH",     amount: 4200,  numberOfTrips: 1, roadExpence: 130, truckId: "trk_101" },
  { id: "t12", date: "2026-04-22", loadingSite: "Kality",        destinationSite: "Mexico",   volume: "MCUBE16", paymentMethod: "DISPATCH", amount: null,  numberOfTrips: 1, roadExpence: 200, truckId: "trk_102" },
  { id: "t13", date: "2026-04-21", loadingSite: "Addis Ababa",   destinationSite: "Dukem",    volume: "MCUBE16", paymentMethod: "CASH",     amount: 7200,  numberOfTrips: 3, roadExpence: 500, truckId: "trk_101" },
  { id: "t14", date: "2026-04-21", loadingSite: "Sendafa",       destinationSite: "Kality",   volume: "MCUBE10", paymentMethod: "DISPATCH", amount: null,  numberOfTrips: 1, roadExpence: 90,  truckId: "trk_102" },
  { id: "t15", date: "2026-04-20", loadingSite: "Mexico",        destinationSite: "Moria",    volume: "MCUBE10", paymentMethod: "CASH",     amount: 3900,  numberOfTrips: 1, roadExpence: 175, truckId: "trk_101" },
  { id: "t16", date: "2026-04-20", loadingSite: "Dukem",         destinationSite: "Sendafa",  volume: "MCUBE16", paymentMethod: "CASH",     amount: 5500,  numberOfTrips: 2, roadExpence: 280, truckId: "trk_102" },
  { id: "t17", date: "2026-04-19", loadingSite: "Kality",        destinationSite: "Moria",    volume: "MCUBE10", paymentMethod: "DISPATCH", amount: null,  numberOfTrips: 1, roadExpence: 110, truckId: "trk_101" },
  { id: "t18", date: "2026-04-19", loadingSite: "Addis Ababa",   destinationSite: "Mexico",   volume: "MCUBE16", paymentMethod: "CASH",     amount: 4700,  numberOfTrips: 1, roadExpence: 190, truckId: "trk_102" },
  { id: "t19", date: "2026-04-18", loadingSite: "Sendafa",       destinationSite: "Dukem",    volume: "MCUBE10", paymentMethod: "CASH",     amount: 3200,  numberOfTrips: 1, roadExpence: 80,  truckId: "trk_101" },
  { id: "t20", date: "2026-04-18", loadingSite: "Mexico",        destinationSite: "Kality",   volume: "MCUBE16", paymentMethod: "DISPATCH", amount: null,  numberOfTrips: 1, roadExpence: 140, truckId: "trk_102" },
  { id: "t21", date: "2026-04-17", loadingSite: "Dukem",         destinationSite: "Moria",    volume: "MCUBE16", paymentMethod: "CASH",     amount: 6800,  numberOfTrips: 2, roadExpence: 400, truckId: "trk_101" },
  { id: "t22", date: "2026-04-17", loadingSite: "Kality",        destinationSite: "Sendafa",  volume: "MCUBE10", paymentMethod: "DISPATCH", amount: null,  numberOfTrips: 1, roadExpence: 95,  truckId: "trk_102" },
  { id: "t23", date: "2026-04-16", loadingSite: "Addis Ababa",   destinationSite: "Mexico",   volume: "MCUBE10", paymentMethod: "CASH",     amount: 4100,  numberOfTrips: 1, roadExpence: 160, truckId: "trk_101" },
  { id: "t24", date: "2026-04-16", loadingSite: "Sendafa",       destinationSite: "Dukem",    volume: "MCUBE16", paymentMethod: "CASH",     amount: 5000,  numberOfTrips: 1, roadExpence: 210, truckId: "trk_102" },
  { id: "t25", date: "2026-04-15", loadingSite: "Mexico",        destinationSite: "Kality",   volume: "MCUBE10", paymentMethod: "DISPATCH", amount: null,  numberOfTrips: 1, roadExpence: 130, truckId: "trk_101" },
];

// ─── Mock Refuels ────────────────────────────────────────────────────
const MOCK_ANALYTICS_REFUELS: AnalyticsRefuel[] = [
  { id: "r1",  date: "2026-04-27", price: 2800,  vol: 90,  truckId: "trk_101" },
  { id: "r2",  date: "2026-04-26", price: 1500,  vol: 50,  truckId: "trk_102" },
  { id: "r3",  date: "2026-04-25", price: 3100,  vol: 100, truckId: "trk_101" },
  { id: "r4",  date: "2026-04-24", price: 2200,  vol: 70,  truckId: "trk_102" },
  { id: "r5",  date: "2026-04-23", price: 1800,  vol: 60,  truckId: "trk_101" },
  { id: "r6",  date: "2026-04-22", price: 2500,  vol: 80,  truckId: "trk_102" },
  { id: "r7",  date: "2026-04-21", price: 3500,  vol: 110, truckId: "trk_101" },
  { id: "r8",  date: "2026-04-20", price: 1200,  vol: 40,  truckId: "trk_102" },
  { id: "r9",  date: "2026-04-19", price: 2900,  vol: 95,  truckId: "trk_101" },
  { id: "r10", date: "2026-04-18", price: 2000,  vol: 65,  truckId: "trk_102" },
  { id: "r11", date: "2026-04-17", price: 3300,  vol: 105, truckId: "trk_101" },
  { id: "r12", date: "2026-04-16", price: 1600,  vol: 55,  truckId: "trk_102" },
  { id: "r13", date: "2026-04-15", price: 2700,  vol: 85,  truckId: "trk_101" },
  { id: "r14", date: "2026-04-14", price: 2100,  vol: 68,  truckId: "trk_102" },
  { id: "r15", date: "2026-04-13", price: 3000,  vol: 98,  truckId: "trk_101" },
];

// ─── Mock Driver Expenses ────────────────────────────────────────────
const MOCK_ANALYTICS_EXPENSES: AnalyticsDriverExpense[] = [
  { id: "de1",  date: "2026-04-27", remark: "Tire repair",          amount: 800,  truckId: "trk_101" },
  { id: "de2",  date: "2026-04-27", remark: "Car wash",             amount: 150,  truckId: "trk_102" },
  { id: "de3",  date: "2026-04-26", remark: "Oil change",           amount: 1200, truckId: "trk_101" },
  { id: "de4",  date: "2026-04-25", remark: "Brake pads",           amount: 2500, truckId: "trk_102" },
  { id: "de5",  date: "2026-04-25", remark: "Windshield wiper",     amount: 350,  truckId: "trk_101" },
  { id: "de6",  date: "2026-04-24", remark: "Battery replacement",  amount: 3000, truckId: "trk_102" },
  { id: "de7",  date: "2026-04-23", remark: "Air filter",           amount: 450,  truckId: "trk_101" },
  { id: "de8",  date: "2026-04-22", remark: "Headlight bulb",       amount: 200,  truckId: "trk_102" },
  { id: "de9",  date: "2026-04-21", remark: "Engine diagnostic",    amount: 500,  truckId: "trk_101" },
  { id: "de10", date: "2026-04-20", remark: "Parking fee",          amount: 100,  truckId: "trk_102" },
  { id: "de11", date: "2026-04-19", remark: "Toll fee",             amount: 250,  truckId: "trk_101" },
  { id: "de12", date: "2026-04-18", remark: "Inspection fee",       amount: 600,  truckId: "trk_102" },
  { id: "de13", date: "2026-04-17", remark: "Oil top-up",           amount: 300,  truckId: "trk_101" },
  { id: "de14", date: "2026-04-16", remark: "Tire rotation",        amount: 400,  truckId: "trk_102" },
  { id: "de15", date: "2026-04-15", remark: "Coolant refill",       amount: 350,  truckId: "trk_101" },
  { id: "de16", date: "2026-04-14", remark: "Belt replacement",     amount: 1800, truckId: "trk_102" },
  { id: "de17", date: "2026-04-13", remark: "Cabin cleaning",       amount: 200,  truckId: "trk_101" },
  { id: "de18", date: "2026-04-12", remark: "Suspension repair",    amount: 4500, truckId: "trk_102" },
  { id: "de19", date: "2026-04-11", remark: "Fuel filter",          amount: 280,  truckId: "trk_101" },
  { id: "de20", date: "2026-04-10", remark: "Mirror replacement",   amount: 750,  truckId: "trk_102" },
];

import { passesDateFilter, DateFilterPreset } from "@/src/components/DateFilterBar";

export interface AnalyticsFilterParams {
  truckId?: string | null;
  preset?: DateFilterPreset;
  customFrom?: Date | null;
  customTo?: Date | null;
}

// ─── Service (simulates API calls) ──────────────────────────────────
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const applyFilters = <T extends { date: string, truckId: string }>(data: T[], params?: AnalyticsFilterParams) => {
  let filtered = data;
  if (params?.truckId && params.truckId !== "all") {
    filtered = filtered.filter(item => item.truckId === params.truckId);
  }
  if (params?.preset) {
    filtered = filtered.filter(item => passesDateFilter(item.date, params.preset!, params.customFrom ?? null, params.customTo ?? null));
  }
  return filtered;
};

export const mockAnalyticsService = {
  getTrips: async (params?: AnalyticsFilterParams) => {
    await delay(600);
    return { trips: applyFilters([...MOCK_ANALYTICS_TRIPS], params) };
  },

  getRefuels: async (params?: AnalyticsFilterParams) => {
    await delay(600);
    return { refuels: applyFilters([...MOCK_ANALYTICS_REFUELS], params) };
  },

  getDriverExpenses: async (params?: AnalyticsFilterParams) => {
    await delay(600);
    return { expenses: applyFilters([...MOCK_ANALYTICS_EXPENSES], params) };
  },

  /** Aggregated summary — simulates a single "dashboard" API call */
  getSummary: async (params?: AnalyticsFilterParams) => {
    await delay(400);
    const trips = applyFilters([...MOCK_ANALYTICS_TRIPS], params);
    const refuels = applyFilters([...MOCK_ANALYTICS_REFUELS], params);
    const expenses = applyFilters([...MOCK_ANALYTICS_EXPENSES], params);

    const totalTrips = trips.reduce((s, t) => s + t.numberOfTrips, 0);
    const cashTrips = trips.filter(t => t.paymentMethod === "CASH");
    const dispatchTrips = trips.filter(t => t.paymentMethod === "DISPATCH");
    const totalCashRevenue = cashTrips.reduce((s, t) => s + (t.amount || 0), 0);
    const totalRoadExpense = trips.reduce((s, t) => s + t.roadExpence, 0);
    const totalRefuelCost = refuels.reduce((s, r) => s + r.price, 0);
    const totalRefuelVol = refuels.reduce((s, r) => s + r.vol, 0);
    const totalDriverExpense = expenses.reduce((s, e) => s + e.amount, 0);

    return {
      totalTrips,
      cashTripCount: cashTrips.length,
      dispatchTripCount: dispatchTrips.length,
      totalCashRevenue,
      totalRoadExpense,
      totalRefuelCost,
      totalRefuelVol,
      totalDriverExpense,
    };
  },

  /** Simulates downloading a pre-built CSV report from the backend */
  downloadReport: async (params?: AnalyticsFilterParams): Promise<string> => {
    await delay(1200); // Simulate network latency

    const trips = applyFilters([...MOCK_ANALYTICS_TRIPS], params);
    const refuels = applyFilters([...MOCK_ANALYTICS_REFUELS], params);
    const expenses = applyFilters([...MOCK_ANALYTICS_EXPENSES], params);

    const rows: string[] = [];

    // CSV Header
    rows.push("Date,Type,Truck,Summary / Site,Amount (ETB),Payment / Remark,Quantity / Volume,Misc (Road Expense)");

    // Trips
    trips.forEach(t => {
      rows.push([
        t.date,
        "Trip",
        t.truckId.replace("trk_", "Truck "),
        `"${t.loadingSite} -> ${t.destinationSite}"`,
        t.amount ?? 0,
        t.paymentMethod,
        `${t.numberOfTrips} trips, ${t.volume.replace("MCUBE", "")} M³`,
        t.roadExpence,
      ].join(","));
    });

    // Refuels
    refuels.forEach(r => {
      rows.push([
        r.date,
        "Fueling",
        r.truckId.replace("trk_", "Truck "),
        "Refuel",
        r.price,
        "Fuel purchase",
        `${r.vol} Liters`,
        "",
      ].join(","));
    });

    // Expenses
    expenses.forEach(e => {
      rows.push([
        e.date,
        "Expense",
        e.truckId.replace("trk_", "Truck "),
        `"${e.remark}"`,
        e.amount,
        "Maintenance/Other",
        "",
        "",
      ].join(","));
    });

    // Sort rows by date (skip header)
    const header = rows[0];
    const dataRows = rows.slice(1).sort((a, b) => b.localeCompare(a));
    return [header, ...dataRows].join("\n");
  },
};

/**
 * Mock Drivers Service
 * --------------------
 * Replace with real API calls when backend is ready.
 */

import { Driver, DriverFilters, PaginatedResponse } from "@/src/types";

const MOCK_DELAY = 600;
const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_DRIVERS: Driver[] = [
  {
    id: "drv_001",
    userId: "usr_002",
    name: "John Driver",
    email: "driver@tbms.com",
    phone: "+254700000001",
    licenseNumber: "DL-2021-001",
    licenseExpiry: "2027-06-30",
    status: "on-trip",
    assignedTruckId: "trk_001",
    totalTrips: 142,
    totalKm: 87400,
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "drv_002",
    userId: "usr_004",
    name: "Peter Kamau",
    email: "peter@tbms.com",
    phone: "+254700000002",
    licenseNumber: "DL-2020-045",
    licenseExpiry: "2026-12-31",
    status: "on-trip",
    assignedTruckId: "trk_004",
    totalTrips: 230,
    totalKm: 154200,
    createdAt: "2022-08-01T08:00:00Z",
  },
  {
    id: "drv_003",
    userId: "usr_005",
    name: "Mary Njeri",
    email: "mary@tbms.com",
    phone: "+254700000003",
    licenseNumber: "DL-2023-112",
    licenseExpiry: "2028-03-15",
    status: "available",
    totalTrips: 56,
    totalKm: 32100,
    createdAt: "2024-06-01T08:00:00Z",
  },
];

export const mockDriverService = {
  async getAll(
    filters?: DriverFilters
  ): Promise<PaginatedResponse<Driver>> {
    await delay(MOCK_DELAY);
    let drivers = [...MOCK_DRIVERS];
    if (filters?.status)
      drivers = drivers.filter((d) => d.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      drivers = drivers.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.phone.includes(q)
      );
    }
    return {
      data: drivers,
      total: drivers.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  },

  async getById(id: string): Promise<Driver> {
    await delay(MOCK_DELAY);
    const driver = MOCK_DRIVERS.find((d) => d.id === id);
    if (!driver) throw new Error("Driver not found");
    return driver;
  },

  async create(
    payload: Omit<Driver, "id" | "createdAt">
  ): Promise<Driver> {
    await delay(MOCK_DELAY);
    const newDriver: Driver = {
      ...payload,
      id: `drv_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    MOCK_DRIVERS.push(newDriver);
    return newDriver;
  },

  async update(id: string, payload: Partial<Driver>): Promise<Driver> {
    await delay(MOCK_DELAY);
    const idx = MOCK_DRIVERS.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Driver not found");
    MOCK_DRIVERS[idx] = { ...MOCK_DRIVERS[idx], ...payload };
    return MOCK_DRIVERS[idx];
  },

  async delete(id: string): Promise<void> {
    await delay(MOCK_DELAY);
    const idx = MOCK_DRIVERS.findIndex((d) => d.id === id);
    if (idx !== -1) MOCK_DRIVERS.splice(idx, 1);
  },
};

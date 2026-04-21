/**
 * Mock Trucks Service
 * -------------------
 * Replace with real API calls when backend is ready.
 */

import { Truck, TruckFilters, PaginatedResponse } from "@/src/types";

const MOCK_DELAY = 600;
const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_TRUCKS: Truck[] = [
  {
    id: "trk_001",
    plateNumber: "KAA 001A",
    model: "Mercedes Actros",
    year: 2021,
    status: "active",
    driverId: "drv_001",
    lastLocation: { lat: -1.286389, lng: 36.817223, address: "Nairobi CBD", updatedAt: new Date().toISOString() },
    mileage: 45200,
    fuelLevel: 78,
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "trk_002",
    plateNumber: "KBB 123B",
    model: "Volvo FH16",
    year: 2020,
    status: "maintenance",
    mileage: 82300,
    fuelLevel: 45,
    createdAt: "2023-06-15T08:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "trk_003",
    plateNumber: "KCC 456C",
    model: "Scania R500",
    year: 2022,
    status: "idle",
    mileage: 19800,
    fuelLevel: 92,
    createdAt: "2024-03-01T08:00:00Z",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "trk_004",
    plateNumber: "KDD 789D",
    model: "MAN TGX",
    year: 2019,
    status: "active",
    driverId: "drv_002",
    lastLocation: { lat: -0.303099, lng: 36.080026, address: "Nakuru", updatedAt: new Date().toISOString() },
    mileage: 127500,
    fuelLevel: 33,
    createdAt: "2022-11-20T08:00:00Z",
    updatedAt: new Date().toISOString(),
  },
];

export const mockTruckService = {
  async getAll(filters?: TruckFilters): Promise<PaginatedResponse<Truck>> {
    await delay(MOCK_DELAY);
    let trucks = [...MOCK_TRUCKS];
    if (filters?.status) trucks = trucks.filter((t) => t.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      trucks = trucks.filter(
        (t) =>
          t.plateNumber.toLowerCase().includes(q) ||
          t.model.toLowerCase().includes(q)
      );
    }
    return { data: trucks, total: trucks.length, page: 1, limit: 20, totalPages: 1 };
  },

  async getById(id: string): Promise<Truck> {
    await delay(MOCK_DELAY);
    const truck = MOCK_TRUCKS.find((t) => t.id === id);
    if (!truck) throw new Error("Truck not found");
    return truck;
  },

  async create(payload: Omit<Truck, "id" | "createdAt" | "updatedAt">): Promise<Truck> {
    await delay(MOCK_DELAY);
    const newTruck: Truck = {
      ...payload,
      id: `trk_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_TRUCKS.push(newTruck);
    return newTruck;
  },

  async update(id: string, payload: Partial<Truck>): Promise<Truck> {
    await delay(MOCK_DELAY);
    const idx = MOCK_TRUCKS.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Truck not found");
    MOCK_TRUCKS[idx] = { ...MOCK_TRUCKS[idx], ...payload, updatedAt: new Date().toISOString() };
    return MOCK_TRUCKS[idx];
  },

  async delete(id: string): Promise<void> {
    await delay(MOCK_DELAY);
    const idx = MOCK_TRUCKS.findIndex((t) => t.id === id);
    if (idx !== -1) MOCK_TRUCKS.splice(idx, 1);
  },
};

/**
 * Mock Trips Service
 * ------------------
 * Replace with real API calls when backend is ready.
 */

import { Trip, TripFilters, PaginatedResponse } from "@/src/types";

const MOCK_DELAY = 600;
const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_TRIPS: Trip[] = [
  {
    id: "trp_001",
    truckId: "trk_001",
    driverId: "drv_001",
    origin: "Nairobi CBD",
    destination: "Mombasa Port",
    status: "in-progress",
    scheduledAt: "2026-04-21T06:00:00Z",
    startedAt: "2026-04-21T06:15:00Z",
    distanceKm: 480,
    cargoDescription: "Electronics",
    cargoWeightTons: 12,
    createdAt: "2026-04-20T18:00:00Z",
  },
  {
    id: "trp_002",
    truckId: "trk_004",
    driverId: "drv_002",
    origin: "Nakuru",
    destination: "Eldoret",
    status: "in-progress",
    scheduledAt: "2026-04-21T08:00:00Z",
    startedAt: "2026-04-21T08:30:00Z",
    distanceKm: 153,
    cargoDescription: "Grain",
    cargoWeightTons: 20,
    createdAt: "2026-04-20T20:00:00Z",
  },
  {
    id: "trp_003",
    truckId: "trk_003",
    driverId: "drv_003",
    origin: "Nairobi ICD",
    destination: "Kisumu",
    status: "scheduled",
    scheduledAt: "2026-04-22T07:00:00Z",
    distanceKm: 350,
    cargoDescription: "Furniture",
    cargoWeightTons: 8,
    createdAt: "2026-04-21T09:00:00Z",
  },
  {
    id: "trp_004",
    truckId: "trk_001",
    driverId: "drv_001",
    origin: "Mombasa Port",
    destination: "Nairobi CBD",
    status: "completed",
    scheduledAt: "2026-04-18T06:00:00Z",
    startedAt: "2026-04-18T06:20:00Z",
    completedAt: "2026-04-18T16:45:00Z",
    distanceKm: 480,
    cargoDescription: "Auto Parts",
    cargoWeightTons: 15,
    createdAt: "2026-04-17T18:00:00Z",
  },
];

export const mockTripService = {
  async getAll(filters?: TripFilters): Promise<PaginatedResponse<Trip>> {
    await delay(MOCK_DELAY);
    let trips = [...MOCK_TRIPS];
    if (filters?.status)
      trips = trips.filter((t) => t.status === filters.status);
    if (filters?.driverId)
      trips = trips.filter((t) => t.driverId === filters.driverId);
    if (filters?.truckId)
      trips = trips.filter((t) => t.truckId === filters.truckId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      trips = trips.filter(
        (t) =>
          t.origin.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q)
      );
    }
    return {
      data: trips,
      total: trips.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
  },

  async getById(id: string): Promise<Trip> {
    await delay(MOCK_DELAY);
    const trip = MOCK_TRIPS.find((t) => t.id === id);
    if (!trip) throw new Error("Trip not found");
    return trip;
  },

  async create(
    payload: Omit<Trip, "id" | "createdAt">
  ): Promise<Trip> {
    await delay(MOCK_DELAY);
    const newTrip: Trip = {
      ...payload,
      id: `trp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    MOCK_TRIPS.push(newTrip);
    return newTrip;
  },

  async update(id: string, payload: Partial<Trip>): Promise<Trip> {
    await delay(MOCK_DELAY);
    const idx = MOCK_TRIPS.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Trip not found");
    MOCK_TRIPS[idx] = { ...MOCK_TRIPS[idx], ...payload };
    return MOCK_TRIPS[idx];
  },
};

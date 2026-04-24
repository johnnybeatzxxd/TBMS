/**
 * Mock Trucks Service
 * -------------------
 * Replace with real API calls when backend is ready.
 */

import { Truck, AddTruckPayload } from "@/src/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_TRUCKS: Truck[] = [
  {
    id: "trk_101",
    plateNumber: "KAA 001A",
    vinNumber: "VIN987654321",
    adminId: "mock_mgr_001",
  },
  {
    id: "trk_102",
    plateNumber: "KBB 123B",
    vinNumber: "VIN123456789",
    adminId: "mock_mgr_001",
  },
];

export const mockTruckService = {
  // GET /admin/trucks/my-trucks
  async getMyTrucks(): Promise<{ trucks: Truck[] } | { message: string }> {
    await delay(600);
    if (MOCK_TRUCKS.length === 0) {
      return { message: "you have no trucks registered. register your trucks to see them here." };
    }
    return { trucks: [...MOCK_TRUCKS] };
  },

  // POST /admin/trucks/add-truck
  async addTruck(payload: AddTruckPayload): Promise<{ message: string; truck: Truck }> {
    await delay(600);
    
    // Simulate unique check for platNumber
    const exists = MOCK_TRUCKS.find((t) => t.plateNumber === payload.plateNumber);
    if (exists) {
      throw new Error("Plate number already exists");
    }

    const newTruck: Truck = {
      id: `trk_${Date.now()}`,
      plateNumber: payload.plateNumber,
      vinNumber: payload.vinNumber,
      adminId: "mock_mgr_001",
    };
    
    MOCK_TRUCKS.push(newTruck);
    return { message: "truck added", truck: newTruck };
  },
};

import { ServiceRequest, RequestStatus } from "@/src/types/request.types";
import { passesDateFilter, DateFilterPreset } from "@/src/components/DateFilterBar";
import { v4 as uuidv4 } from "uuid";

// Initial set of mock records spanning multiple dates and statuses
let MOCK_REQUESTS: ServiceRequest[] = [
  { id: "req_1", driverId: "d1", truckId: "trk_101", type: "Oil Change", status: "pending", description: "Need regular oil change after 10,000 km.", date: "2026-04-27", createdAt: "2026-04-27T08:00:00Z", updatedAt: "2026-04-27T08:00:00Z" },
  { id: "req_2", driverId: "d2", truckId: "trk_102", type: "Advance Payment", status: "accepted", amount: 2000, description: "Advance for upcoming holiday.", date: "2026-04-26", createdAt: "2026-04-26T10:30:00Z", updatedAt: "2026-04-26T12:00:00Z" },
  { id: "req_3", driverId: "d1", truckId: "trk_101", type: "Tire Replacement", status: "declined", description: "Rear right side tire is worn out.", date: "2026-04-25", createdAt: "2026-04-25T14:15:00Z", updatedAt: "2026-04-25T15:00:00Z" },
  { id: "req_4", driverId: "d2", truckId: "trk_102", type: "Maintenance", status: "pending", description: "Engine making strange noise.", date: "2026-04-25", createdAt: "2026-04-25T09:20:00Z", updatedAt: "2026-04-25T09:20:00Z" },
  { id: "req_5", driverId: "d1", truckId: "trk_101", type: "Salary", status: "accepted", amount: 15000, description: "Monthly salary remaining.", date: "2026-04-22", createdAt: "2026-04-22T11:45:00Z", updatedAt: "2026-04-23T08:10:00Z" },
  { id: "req_6", driverId: "d2", truckId: "trk_102", type: "Other", status: "accepted", description: "Need new safety gear (gloves, helmet).", date: "2026-04-20", createdAt: "2026-04-20T16:00:00Z", updatedAt: "2026-04-21T09:00:00Z" },
  { id: "req_7", driverId: "d1", truckId: "trk_101", type: "Advance Payment", status: "pending", amount: 500, description: "Unexpected personal expense.", date: "2026-04-27", createdAt: "2026-04-27T08:45:00Z", updatedAt: "2026-04-27T08:45:00Z" },
  { id: "req_8", driverId: "d2", truckId: "trk_102", type: "Oil Change", status: "accepted", description: "Routine maintenance scheduled.", date: "2026-04-18", createdAt: "2026-04-18T07:30:00Z", updatedAt: "2026-04-18T09:00:00Z" },
  { id: "req_9", driverId: "d1", truckId: "trk_101", type: "Maintenance", status: "accepted", amount: 3500, description: "Brake pad replacement.", date: "2026-04-15", createdAt: "2026-04-15T13:00:00Z", updatedAt: "2026-04-15T15:30:00Z" },
  { id: "req_10", driverId: "d2", truckId: "trk_102", type: "Tire Replacement", status: "declined", description: "Front tires requested, but they are relatively new.", date: "2026-04-12", createdAt: "2026-04-12T10:10:00Z", updatedAt: "2026-04-13T09:00:00Z" },
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const mockRequestsService = {
  getRequests: async (options?: { 
    preset?: DateFilterPreset, 
    customFrom?: Date | null, 
    customTo?: Date | null,
    truckId?: string,
    role?: "driver" | "manager" | "admin",
    driverId?: string // If Role is Driver, they only see their requests
  }) => {
    await delay(300);
    
    let filtered = [...MOCK_REQUESTS];

    // Filter by Role (Driver only sees their own)
    if (options?.role === "driver" && options?.driverId) {
      filtered = filtered.filter(r => r.driverId === options.driverId);
    }

    // Filter by Truck
    if (options?.truckId && options.truckId !== "all") {
      filtered = filtered.filter(r => r.truckId === options.truckId);
    }

    // Filter by Date
    if (options?.preset) {
      filtered = filtered.filter(r => passesDateFilter(r.date, options.preset!, options.customFrom ?? null, options.customTo ?? null));
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { requests: filtered };
  },

  addRequest: async (payload: Omit<ServiceRequest, "id" | "status" | "createdAt" | "updatedAt">) => {
    await delay(500);
    
    const newRequest: ServiceRequest = {
      ...payload,
      id: `req_${uuidv4().substring(0, 8)}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    MOCK_REQUESTS.unshift(newRequest); // Add to head
    return { request: newRequest };
  },

  updateStatus: async (requestId: string, status: RequestStatus) => {
    await delay(400);
    const index = MOCK_REQUESTS.findIndex(r => r.id === requestId);
    if (index === -1) throw new Error("Request not found");
    
    MOCK_REQUESTS[index] = {
      ...MOCK_REQUESTS[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    
    return { request: MOCK_REQUESTS[index] };
  }
};

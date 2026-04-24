import { Driver, CreateDriverPayload, UpdateDriverPayload } from "@/src/types";

// Simulating database latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let MOCK_DRIVERS: Driver[] = [
  {
    id: "drv_001",
    name: "John Driver",
    truckId: "trk_101",
    adminId: "mock_mgr_001",
    accountId: "acc_001",
    username: "john_d",
    password: "password123",
    accountActive: true,
  },
  {
    id: "drv_002",
    name: "Alex Smooth",
    truckId: "trk_102",
    adminId: "mock_mgr_001",
    accountId: "acc_002",
    username: "alex_s",
    password: "password123",
    accountActive: false,
  },
];

export const mockDriverService = {
  // GET /admin/my-drivers
  async getMyDrivers(): Promise<{ drivers: Driver[] }> {
    await delay(600);
    return { drivers: [...MOCK_DRIVERS] };
  },

  // POST /admin/driver-account/create-driver-account
  async createDriver(payload: CreateDriverPayload): Promise<{ driver: Driver }> {
    await delay(800);
    
    // Simulate unique username check (simple mock logic)
    if (payload.username === "taken_user") {
      throw new Error("username already taken");
    }

    const newDriver: Driver = {
      id: `drv_${Date.now()}`,
      name: payload.name,
      truckId: payload.truckId,
      adminId: "mock_mgr_001", // hardcoded mock admin
      accountId: `acc_${Date.now()}`,
      username: payload.username,
      password: payload.password,
      accountActive: true,
    };

    MOCK_DRIVERS.push(newDriver);
    return { driver: newDriver };
  },

  // PUT /admin/driver-account/deactivate-driver-account/:id
  async deactivateDriver(id: string): Promise<{ message: string }> {
    await delay(500);
    const driver = MOCK_DRIVERS.find((d) => d.id === id);
    if (!driver) throw new Error("driver account missing");
    
    driver.accountActive = false;
    return { message: "driver account deactivated." };
  },

  // PUT /admin/driver-account/activate-driver-account/:id
  async activateDriver(id: string): Promise<{ message: string }> {
    await delay(500);
    const driver = MOCK_DRIVERS.find((d) => d.id === id);
    if (!driver) throw new Error("driver account missing");
    
    driver.accountActive = true;
    return { message: "driver account activated." };
  },

  // DELETE /admin/driver-account/delete-driver-account/:id
  async deleteDriver(id: string): Promise<{ message: string }> {
    await delay(700);
    const idx = MOCK_DRIVERS.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("driver account missing");
    
    const name = MOCK_DRIVERS[idx].name;
    MOCK_DRIVERS.splice(idx, 1);
    return { message: `driver account deleted: ${name}` };
  },

  // POST /admin/driver-account/update-driver-profile/:id
  async updateDriverProfile(id: string, payload: UpdateDriverPayload): Promise<{ message: string }> {
    await delay(600);
    const driver = MOCK_DRIVERS.find((d) => d.id === id);
    if (!driver) throw new Error("driver profile missing");
    
    if (payload.name) driver.name = payload.name;
    if (payload.truckId) driver.truckId = payload.truckId;
    if (payload.username) driver.username = payload.username;
    if (payload.password) driver.password = payload.password;
    // Note: In a real system username/password might have separate security endpoints
    // but for mock purposes we update them here.
    return { message: "profile updated" };
  },
};

/**
 * API Services barrel export
 * --------------------------
 * Import services from here throughout the app.
 * When the real backend is ready, swap mock services
 * for real ones without changing any component imports.
 *
 * Example:
 *   import { authService, truckService } from "@/src/api/services";
 */

export { mockAuthService as authService } from "./mock/auth.mock";
export { mockTruckService as truckService } from "./mock/trucks.mock";
export { mockDriverService as driverService } from "./mock/drivers.mock";
export { mockTripService as tripService } from "./mock/trips.mock";

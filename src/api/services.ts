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

export { authService } from "./auth.service";
export { tripService } from "./trip.service";
export { companyService } from "./company.service";
export { truckService } from "./truck.service";
export { driverService } from "./driver.service";
export { mockAnalyticsService as analyticsService } from "./mock/analytics.mock";
export { mockRequestsService as requestService } from "./mock/requests.mock";
export { mockExpenseService as expenseService } from "./mock/expenses.mock";
export { transferService } from "./transfer.service";

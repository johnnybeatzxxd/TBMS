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
export { expenseService } from "./expense.service";
export { transferService } from "./transfer.service";
export { refuelService } from "./refuel.service";
export { reminderService } from "./reminder.service";
export { displayService } from "./display.service";
export { formService } from "./form.service";

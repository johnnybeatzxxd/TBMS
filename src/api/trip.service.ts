/**
 * Trip Service API
 * -----------------
 * Handles all real REST API interactions for Trips.
 * Automatically utilizes `apiFetch` which attaches session cookies.
 */

import { apiFetch } from "./config";
import { 
  Trip, 
  AddTripPayload, 
  UpdateTripPayload, 
  GetTripsQuery, 
  PaginatedTrips 
} from "@/src/types/trip.types";

export const tripService = {
  /**
   * Get allowed companies for the current driver/user
   */
  async getAllowedCompanies(): Promise<Array<{id: string, name: string}>> {
    const res = await apiFetch("/trip/get-allowed-companies");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch allowed companies");
    }
    const data = await res.json();
    return data.companies || [];
  },

  /**
   * Add a new Cash or Credit Trip (Driver only)
   */
  async addTrip(payload: AddTripPayload): Promise<Trip> {
    const res = await apiFetch("/trip/add-trip", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create trip");
    }
    const data = await res.json();
    // The endpoint returns `{ trip: {...} }` or similar, fallback appropriately
    return data.trip || data;
  },

  /**
   * Update an existing Trip (Admin only)
   */
  async updateTrip(id: string, payload: UpdateTripPayload): Promise<Trip> {
    const res = await apiFetch(`/trip/update-trip/${id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update trip");
    }
    const data = await res.json();
    return data.trip || data;
  },

  /**
   * Approve a pending Trip (Admin only)
   */
  async approveTrip(tripId: string, tripType: "CASH" | "CREDIT" = "CASH"): Promise<{ message: string; updatedTrip: Trip; newDriverBalnce?: number }> {
    const res = await apiFetch(`/trip/approve-trip/${tripId}/${tripType}`, {
      method: "PUT",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to approve trip");
    }
    return res.json();
  },

  /**
   * Get filtered paginated trips
   * Unifies standard query logic.
   */
  async getTrips(query: GetTripsQuery = {}): Promise<PaginatedTrips> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === "string" && value.trim() === "") return;
      if (value instanceof Date) {
        params.append(key, value.toISOString());
        return;
      }
      if (typeof value === "boolean") {
        params.append(key, value ? "true" : "false");
        return;
      }
      params.append(key, String(value));
    });

    const queryString = params.toString();
    const endpoint = `/trip/get-trips${queryString ? `?${queryString}` : ""}`;

    console.log("[TripService] getTrips request", {
      query,
      queryString,
      endpoint,
    });

    const res = await apiFetch(endpoint);
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch trips");
    }
    
    const json = await res.json();
    const trips = json.data || json.allTrips || [];

    console.log("[TripService] getTrips response", {
      endpoint,
      status: res.status,
      totalItems: json.meta?.totalItems,
      currentPage: json.meta?.currentPage,
      totalPages: json.meta?.totalPages,
      returnedCount: trips.length,
      returnedTripDates: trips.map((trip: Trip) => ({
        id: trip.id,
        date: trip.date,
        truckId: trip.truckId,
        paymentMethod: trip.paymentMethod,
        approved: trip.approved,
      })),
    });

    // Standardize the response wrapper
    // The doc says "allTrips" for one endpoint and "data" for the exact filtered query.
    // The `/trip/get-trips` doc explicitly returns `{ data: [], meta: {} }` string format.
    return {
      data: trips,
      meta: json.meta || {
        totalItems: 0,
        currentPage: 1,
        perPage: 10,
        totalPages: 0,
      },
    };
  },

  /**
   * Delete a non-approved trip
   * DELETE /trip/delete-trip/:tripId/:paymentMethod
   */
  async deleteTrip(tripId: string, paymentMethod: "CASH" | "CREDIT"): Promise<{ message: string }> {
    console.log(`[TripService] deleteTrip: id=${tripId}, paymentMethod=${paymentMethod}`);
    const res = await apiFetch(`/trip/delete-trip/${tripId}/${paymentMethod}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete trip");
    }
    return res.json();
  },
};

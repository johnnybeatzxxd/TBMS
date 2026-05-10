/**
 * Form / Service Request API Service
 * ------------------------------------
 * Real API service for form templates and service requests.
 * Replaces form.mock.ts — talks to the /expences endpoints.
 */

import { apiFetch } from "./config";
import {
  FormTemplate,
  FormSubmission,
  CreateFormTemplatePayload,
  SubmitFormPayload,
} from "@/src/types/form.types";

export const formService = {
  // ── Template CRUD (Admin) ──────────────────────────────────────────

  /**
   * GET /expences/get-service-request-names
   * Fetch list of active service request form names/ids.
   */
  async getFormTemplates(): Promise<{ templates: FormTemplate[] }> {
    const res = await apiFetch("/expences/get-service-request-names");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch form templates");
    }
    const data = await res.json();
    // Backend returns { serviceTypes: [{ id, name }] }
    // Map to our FormTemplate shape (lightweight — no fields yet)
    const templates: FormTemplate[] = (data.serviceTypes || []).map((st: any) => ({
      id: st.id || st._id,
      name: st.name,
      category: st.category || "General",
      description: st.description || "",
      requiresApproval: st.requiresApproval ?? true,
      fields: st.formData || [],
      adminId: st.adminId,
      createdAt: st.createdAt || new Date().toISOString(),
      updatedAt: st.updatedAt || new Date().toISOString(),
    }));
    return { templates };
  },

  /**
   * GET /expences/get-service-request-form/:id
   * Fetch full details of a specific form template.
   */
  async getFormTemplate(id: string): Promise<FormTemplate | null> {
    const res = await apiFetch(`/expences/get-service-request-form/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch form template");
    }
    const data = await res.json();
    const st = data.serviceType || data;
    return {
      id: st.id || st._id,
      name: st.name,
      category: st.category || "General",
      description: st.description || "",
      requiresApproval: st.requiresApproval ?? true,
      fields: st.formData || [],
      allowedTruckIds: st.allowedTrucks?.map((t: any) => t.id) || [],
      adminId: st.adminId,
      createdAt: st.createdAt || new Date().toISOString(),
      updatedAt: st.updatedAt || new Date().toISOString(),
    };
  },

  /**
   * POST /expences/create-expence-form
   * Create a new service request form template.
   */
  async createFormTemplate(payload: CreateFormTemplatePayload): Promise<FormTemplate> {
    const res = await apiFetch("/expences/create-expence-form", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        requiresApproval: payload.requiresApproval,
        formData: payload.fields,
        isActive: true,
        allowedTruckIds: payload.allowedTruckIds?.length ? payload.allowedTruckIds : undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create form template");
    }
    const data = await res.json();
    const st = data.serviceType || data;
    return {
      id: st.id || st._id,
      name: st.name,
      category: payload.category || "General",
      description: payload.description || "",
      requiresApproval: st.requiresApproval ?? payload.requiresApproval,
      fields: st.formData || payload.fields,
      adminId: st.adminId,
      createdAt: st.createdAt || new Date().toISOString(),
      updatedAt: st.updatedAt || new Date().toISOString(),
    };
  },

  /**
   * PUT /expences/update-service-request-form/:id
   * Update an existing form template.
   */
  async updateFormTemplate(id: string, payload: Partial<CreateFormTemplatePayload>): Promise<FormTemplate> {
    const body: any = {};
    if (payload.name) body.name = payload.name;
    if (payload.requiresApproval !== undefined) body.requiresApproval = payload.requiresApproval;
    if (payload.fields) body.formData = payload.fields;
    if (payload.allowedTruckIds !== undefined) body.allowedTruckIds = payload.allowedTruckIds.length ? payload.allowedTruckIds : undefined;

    const res = await apiFetch(`/expences/update-service-request-form/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update form template");
    }
    const data = await res.json();
    const st = data.serviceType || data;
    return {
      id: st.id || st._id,
      name: st.name,
      category: payload.category || "General",
      description: payload.description || "",
      requiresApproval: st.requiresApproval ?? true,
      fields: st.formData || [],
      createdAt: st.createdAt || new Date().toISOString(),
      updatedAt: st.updatedAt || new Date().toISOString(),
    };
  },

  /**
   * DELETE /expences/delete-service-request-form/:id
   * Delete a form template.
   */
  async deleteFormTemplate(id: string): Promise<void> {
    const res = await apiFetch(`/expences/delete-service-request-form/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete form template");
    }
  },

  // ── Submissions ──────────────────────────────────────────────────

  /**
   * POST /expences/submit-service-request/:serviceId
   * Submit a filled service request (Driver).
   */
  async submitForm(serviceId: string, payload: SubmitFormPayload): Promise<FormSubmission> {
    const requestBody = {
      formData: payload.formData,
      totalCost: payload.totalCost,
      description: payload.description,
      date: payload.date,
    };
    console.log("Submit Service Request Payload:", JSON.stringify(requestBody, null, 2));

    const res = await apiFetch(`/expences/submit-service-request/${serviceId}`, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to submit service request");
    }
    const data = await res.json();
    return mapBackendRequestToSubmission(data.serviceRequest || data);
  },

  /**
   * GET /expences/get-service-requests
   * Fetch service requests with optional filters.
   */
  async getFormSubmissions(filters?: {
    driverId?: string;
    truckId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    serviceTypeId?: string;
  }): Promise<{ submissions: FormSubmission[] }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const qs = params.toString();
    const res = await apiFetch(`/expences/get-service-requests${qs ? `?${qs}` : ""}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch service requests");
    }
    const data = await res.json();
    const submissions = (data.serviceRequests || []).map(mapBackendRequestToSubmission);
    return { submissions };
  },

  /**
   * GET /expences/get-service-request/:id
   * Fetch a single service request by ID.
   */
  async getSubmission(id: string): Promise<FormSubmission> {
    const res = await apiFetch(`/expences/get-service-request/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch service request");
    }
    const data = await res.json();
    return mapBackendRequestToSubmission(data.serviceRequest || data);
  },

  /**
   * POST /expences/update-service-request-driver/:id
   * Update a pending/proceed service request (Driver).
   */
  async updateSubmission(id: string, payload: { date?: string; cost?: number; dynamicData?: any }): Promise<void> {
    const res = await apiFetch(`/expences/update-service-request-driver/${id}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update service request");
    }
  },

  /**
   * DELETE /expences/delete-service-request/:requestId
   * Delete a pending service request (Admin).
   */
  async deleteSubmission(id: string): Promise<void> {
    const res = await apiFetch(`/expences/delete-service-request/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to delete service request");
    }
  },

  // ── Status Management ────────────────────────────────────────────

  /**
   * PUT /expences/mark-request-to-proceed/:requestId
   * Admin authorizes driver to proceed.
   */
  async markProceed(id: string): Promise<void> {
    const res = await apiFetch(`/expences/mark-request-to-proceed/${id}`, { method: "PUT" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to mark as proceed");
    }
  },

  /**
   * PUT /expences/mark-request-to-completed/:requestId
   * Driver marks a proceed request as completed.
   */
  async markCompleted(id: string): Promise<void> {
    const res = await apiFetch(`/expences/mark-request-to-completed/${id}`, { method: "PUT" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to mark as completed");
    }
  },

  /**
   * PUT /expences/mark-request-to-approved/:requestId
   * Admin gives final approval to a completed request.
   */
  async markApproved(id: string): Promise<void> {
    const res = await apiFetch(`/expences/mark-request-to-approved/${id}`, { method: "PUT" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to mark as approved");
    }
  },

  /**
   * PUT /expences/mark-request-to-declined/:requestId
   * Admin declines a pending request.
   */
  async markDeclined(id: string): Promise<void> {
    const res = await apiFetch(`/expences/mark-request-to-declined/${id}`, { method: "PUT" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to decline request");
    }
  },
};

// ── Helper: Map backend response to our FormSubmission type ────────────

function mapBackendRequestToSubmission(req: any): FormSubmission {
  return {
    id: req._id || req.id,
    templateId: req.serviceTypeId?._id || req.serviceTypeId || "",
    templateName: req.serviceTypeId?.name || req.serviceType?.name || req.serviceTypeName || "Unknown",
    category: req.serviceTypeId?.category || req.category || "General",
    driverId: req.driverId?._id || req.driverId || "",
    driverName: req.driverId?.name || req.driverName || "",
    truckId: req.truckId?._id || req.truckId || "",
    truckPlate: req.truckId?.plateNumber || req.truckPlate || "",
    amount: req.totalCost || req.cost || 0,
    values: req.formData || req.dynamicData || {},
    description: req.description || "",
    date: req.date,
    status: req.status || "PENDING",
    requiresApproval: req.serviceTypeId?.requiresApproval ?? req.serviceType?.requiresApproval ?? true,
    createdAt: req.createdAt || new Date().toISOString(),
    updatedAt: req.updatedAt || new Date().toISOString(),
  };
}

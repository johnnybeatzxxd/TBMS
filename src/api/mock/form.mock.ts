/**
 * Form Service (Mock)
 * -------------------
 * In-memory mock service for form templates and submissions.
 * When the backend is ready, replace the internals with apiFetch calls.
 * The JSON structure is production-ready — backend just stores it as-is.
 */

import { FormTemplate, FormSubmission, CreateFormTemplatePayload, SubmitFormPayload } from "../../types/form.types";

// ── In-Memory Store ──────────────────────────────────────────────────

let templates: FormTemplate[] = [];
let submissions: FormSubmission[] = [];

const generateId = () => `form_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Template CRUD ────────────────────────────────────────────────────

export const mockFormService = {

  // List all form templates
  async getFormTemplates(): Promise<{ templates: FormTemplate[] }> {
    await delay(300);
    return { templates: [...templates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
  },

  // Get single template by ID
  async getFormTemplate(id: string): Promise<FormTemplate | null> {
    await delay(200);
    return templates.find(t => t.id === id) || null;
  },

  // Create a new form template
  async createFormTemplate(payload: CreateFormTemplatePayload): Promise<FormTemplate> {
    await delay(400);
    const now = new Date().toISOString();
    const template: FormTemplate = {
      id: generateId(),
      ...payload,
      isActive: payload.isActive === true,
      createdAt: now,
      updatedAt: now,
    };
    templates.unshift(template);
    return template;
  },

  // Update an existing template
  async updateFormTemplate(id: string, payload: Partial<CreateFormTemplatePayload>): Promise<FormTemplate> {
    await delay(400);
    const idx = templates.findIndex(t => t.id === id);
    if (idx === -1) throw new Error("Template not found");
    templates[idx] = {
      ...templates[idx],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    return templates[idx];
  },

  // Delete a template
  async deleteFormTemplate(id: string): Promise<void> {
    await delay(300);
    templates = templates.filter(t => t.id !== id);
  },

  // ── Submissions ──────────────────────────────────────────────────

  // Submit a filled form (driver)
  async submitForm(templateId: string, driverId: string, driverName: string, payload: SubmitFormPayload): Promise<FormSubmission> {
    await delay(400);
    let template = templates.find(t => t.id === templateId);
    if (templateId === "other") {
      template = {
        id: "other",
        name: "Other Request",
        category: "General",
        requiresApproval: true,
        fields: []
      } as any;
    }
    if (!template) throw new Error("Form template not found");

    const now = new Date().toISOString();
    const submission: FormSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      templateId,
      templateName: template.name,
      category: template.category,
      driverId,
      driverName,
      truckId: payload.truckId,
      truckPlate: payload.truckPlate,
      amount: payload.amount,
      values: payload.values,
      status: template.requiresApproval ? "PENDING" : "APPROVED",
      createdAt: now,
      updatedAt: now,
    };
    submissions.unshift(submission);
    return submission;
  },

  // Get all submissions (admin sees all, driver sees own)
  async getFormSubmissions(filters?: { driverId?: string }): Promise<{ submissions: FormSubmission[] }> {
    await delay(300);
    let result = [...submissions];
    if (filters?.driverId) {
      result = result.filter(s => s.driverId === filters.driverId);
    }
    return { submissions: result };
  },

  // Update submission status (admin approve/decline)
  async updateSubmissionStatus(id: string, status: "APPROVED" | "DECLINED"): Promise<FormSubmission> {
    await delay(300);
    const idx = submissions.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Submission not found");
    submissions[idx] = { ...submissions[idx], status, updatedAt: new Date().toISOString() };
    return submissions[idx];
  },
};

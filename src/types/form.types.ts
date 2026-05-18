/**
 * Dynamic Form Builder Types
 * --------------------------
 * These types define the JSON schema that will be stored in the backend.
 * The FormTemplate is what admins create. The FormSubmission is what drivers fill out.
 */

// Supported data types for custom fields
export type FieldType = "text" | "number" | "date" | "select" | "boolean" | "image";

// A single field in a form template
export interface FormField {
  id: string;                // Unique ID (UUID) — used as key in submissions
  label: string;             // Display name, e.g. "Mileage at service"
  type: FieldType;           // Data type of this field
  required: boolean;         // Whether the driver must fill this field
  placeholder?: string;      // Hint text for the input
  options?: string[];        // Only used when type === "select"
  dependsOn?: {              // Conditional visibility
    fieldId: string;         // ID of the parent field
    value: any;              // Value that makes this field visible (true/false for boolean, option string for select)
  };
}

// A form template created by an admin
export interface FormTemplate {
  id: string;
  name: string;              // e.g. "Oil Change Request"
  category: string;          // e.g. "Maintenance", "Payment", "General"
  description?: string;      // Short explanation shown to drivers
  requiresApproval: boolean; // true = admin must review, false = auto-approved
  fields: FormField[];       // Custom fields defined by admin
  adminId?: string;          // Owner admin
  allowedTruckIds?: string[]; // IDs of trucks allowed to use this form
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}

// Payload to create/update a form template
export interface CreateFormTemplatePayload {
  name: string;
  category: string;
  description?: string;
  requiresApproval: boolean;
  fields: FormField[];
  allowedTruckIds?: string[];
}

// What a driver submits when filling a form
export interface FormSubmission {
  id: string;
  templateId: string;          // maps to serviceTypeId from backend
  templateName: string;        // maps to serviceType.name from backend
  category: string;
  driverId: string;
  driverName?: string;
  truckId: string;
  truckPlate?: string;
  amount: number;                   // maps to totalCost from backend
  values: Record<string, any>;     // maps to formData from backend
  description?: string;
  date?: string;                   // request date
  status: "PENDING" | "PROCEED" | "COMPLETED" | "APPROVED" | "DECLINED";
  requiresApproval?: boolean;      // from serviceType.requiresApproval
  tag?: string;                    // for direct expenses like PERDIME/SALARY
  serviceRequestId?: string;       // linked service request ID
  receiptPic?: string | null;      // from linked expense or request
  createdAt: string;
  updatedAt: string;
}

// Payload for driver to submit a filled form
export interface SubmitFormPayload {
  formData: Record<string, any>;   // Dynamic form field values
  totalCost: number;
  description?: string;
  date?: string;
}

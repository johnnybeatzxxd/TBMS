export interface Reminder {
  id?: string;
  _id?: string;
  reminderName: string;
  reminderMessage: string;
  reminderType: "ONE_TIME" | "RECURRING";
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | null;
  reminderStart: string; // ISO String
  deadline?: string; // ISO String
  remindDrivers: string[];
  reminderActive: boolean;
  truckId?: string;
  adminId?: string;
  createdAt?: string;
  updatedAt?: string;
  lastAlertSent?: string;
}

export interface AddReminderPayload {
  reminderName: string;
  reminderMessage: string;
  reminderType?: "ONE_TIME" | "RECURRING";
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY";
  reminderStart: string; // ISO String
  deadline?: string; // ISO String
  remindDrivers?: string[];
  reminderActive?: boolean;
  truckId?: string;
}

export interface UpdateReminderPayload {
  reminderName?: string;
  reminderMessage?: string;
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY";
  reminderStart?: string;
  deadline?: string;
  reminderActive?: boolean;
}

export interface GetRemindersFilters {
  reminderName?: string;
  reminderActive?: boolean;
  reminderType?: "ONE_TIME" | "RECURRING";
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY";
}

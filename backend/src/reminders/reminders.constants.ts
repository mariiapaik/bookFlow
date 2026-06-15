export const REMINDER_QUEUE = 'appointment-reminders';

export interface ReminderJobData {
  bookingId: string;
}

/** How long before the appointment the reminder fires. */
export const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

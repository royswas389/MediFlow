import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const activityTypeEnum = pgEnum("activity_type", [
  "registration", "token_issued", "called", "completed", "emergency", "triage", "appointment"
]);

export const activityEventsTable = pgTable("activity_events", {
  id: serial("id").primaryKey(),
  type: activityTypeEnum("type").notNull(),
  description: text("description").notNull(),
  patientName: text("patient_name"),
  departmentName: text("department_name"),
  patientId: integer("patient_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type ActivityEvent = typeof activityEventsTable.$inferSelect;

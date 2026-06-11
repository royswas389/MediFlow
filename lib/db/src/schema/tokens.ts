import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tokenStatusEnum = pgEnum("token_status", [
  "waiting", "called", "in_consultation", "completed", "cancelled", "emergency"
]);

export const triageCategoryEnum = pgEnum("triage_category", [
  "emergency", "urgent", "normal"
]);

export const queueTokensTable = pgTable("queue_tokens", {
  id: serial("id").primaryKey(),
  tokenNumber: text("token_number").notNull(),
  patientId: integer("patient_id").notNull(),
  departmentId: integer("department_id").notNull(),
  doctorId: integer("doctor_id"),
  status: tokenStatusEnum("status").notNull().default("waiting"),
  priority: integer("priority").notNull().default(100),
  triageCategory: triageCategoryEnum("triage_category").default("normal"),
  estimatedWaitMinutes: integer("estimated_wait_minutes").notNull().default(15),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at"),
});

export const insertQueueTokenSchema = createInsertSchema(queueTokensTable).omit({ id: true, issuedAt: true });
export type InsertQueueToken = z.infer<typeof insertQueueTokenSchema>;
export type QueueToken = typeof queueTokensTable.$inferSelect;

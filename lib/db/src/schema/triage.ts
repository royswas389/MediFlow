import { pgTable, serial, text, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const triageResultCategoryEnum = pgEnum("triage_result_category", [
  "emergency", "urgent", "normal"
]);

export const triageResultsTable = pgTable("triage_results", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  category: triageResultCategoryEnum("category").notNull(),
  riskScore: real("risk_score").notNull(),
  reasoning: text("reasoning").notNull(),
  symptoms: text("symptoms").notNull(),
  recommendedDepartment: text("recommended_department"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTriageResultSchema = createInsertSchema(triageResultsTable).omit({ id: true, createdAt: true });
export type InsertTriageResult = z.infer<typeof insertTriageResultSchema>;
export type TriageResult = typeof triageResultsTable.$inferSelect;

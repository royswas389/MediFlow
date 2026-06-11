import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctorStatusEnum = pgEnum("doctor_status", [
  "available", "busy", "on_break", "off_duty"
]);

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
  departmentId: integer("department_id").notNull(),
  status: doctorStatusEnum("status").notNull().default("available"),
  consultationsToday: integer("consultations_today").notNull().default(0),
  avgConsultationMinutes: integer("avg_consultation_minutes").notNull().default(10),
  currentPatientId: integer("current_patient_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDoctorSchema = createInsertSchema(doctorsTable).omit({ id: true, createdAt: true });
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctorsTable.$inferSelect;

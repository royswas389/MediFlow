import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientStatusEnum = pgEnum("patient_status", [
  "registered", "waiting", "in_consultation", "completed", "emergency"
]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  age: integer("age"),
  gender: genderEnum("gender"),
  bloodGroup: text("blood_group"),
  hospitalId: text("hospital_id").notNull(),
  status: patientStatusEnum("status").notNull().default("registered"),
  medicalHistory: text("medical_history"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ id: true, createdAt: true, hospitalId: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;

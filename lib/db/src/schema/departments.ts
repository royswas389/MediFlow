import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const departmentStatusEnum = pgEnum("department_status", [
  "active", "busy", "overloaded", "closed"
]);

export const departmentsTable = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  status: departmentStatusEnum("status").notNull().default("active"),
  capacity: integer("capacity").notNull().default(20),
  currentLoad: integer("current_load").notNull().default(0),
  avgWaitMinutes: integer("avg_wait_minutes").notNull().default(15),
  floor: text("floor"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDepartmentSchema = createInsertSchema(departmentsTable).omit({ id: true, createdAt: true });
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departmentsTable.$inferSelect;

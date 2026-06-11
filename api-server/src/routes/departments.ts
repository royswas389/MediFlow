import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, departmentsTable, queueTokensTable, patientsTable, doctorsTable } from "@workspace/db";
import {
  CreateDepartmentBody,
  GetDepartmentParams,
  GetDepartmentQueueParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/departments", async (_req, res): Promise<void> => {
  const departments = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  res.json(departments);
});

router.post("/departments", async (req, res): Promise<void> => {
  const parsed = CreateDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [dept] = await db.insert(departmentsTable).values(parsed.data as any).returning();
  res.status(201).json(dept);
});

router.get("/departments/:id", async (req, res): Promise<void> => {
  const params = GetDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, params.data.id));
  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }
  res.json(dept);
});

router.get("/departments/:id/queue", async (req, res): Promise<void> => {
  const params = GetDepartmentQueueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const tokens = await db
    .select()
    .from(queueTokensTable)
    .where(eq(queueTokensTable.departmentId, params.data.id))
    .orderBy(queueTokensTable.priority, queueTokensTable.issuedAt);

  const enriched = await Promise.all(tokens.map(async (token, idx) => {
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, token.patientId));
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, token.departmentId));
    const doctor = token.doctorId
      ? (await db.select().from(doctorsTable).where(eq(doctorsTable.id, token.doctorId)))[0]
      : null;
    return {
      ...token,
      patientName: patient?.name ?? "Unknown",
      departmentName: dept?.name ?? null,
      doctorName: doctor?.name ?? null,
      position: idx + 1,
    };
  }));

  res.json(enriched);
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, doctorsTable, departmentsTable, queueTokensTable, patientsTable } from "@workspace/db";
import {
  ListDoctorsQueryParams,
  CreateDoctorBody,
  GetDoctorParams,
  UpdateDoctorParams,
  UpdateDoctorBody,
  GetDoctorQueueParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/doctors", async (req, res): Promise<void> => {
  const parsed = ListDoctorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conditions = [];
  if (parsed.data.departmentId) {
    conditions.push(eq(doctorsTable.departmentId, Number(parsed.data.departmentId)));
  }
  if (parsed.data.available === true || parsed.data.available === "true" as any) {
    conditions.push(eq(doctorsTable.status, "available"));
  }

  const doctors = await db
    .select({
      doctor: doctorsTable,
      departmentName: departmentsTable.name,
    })
    .from(doctorsTable)
    .leftJoin(departmentsTable, eq(doctorsTable.departmentId, departmentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(doctorsTable.name);

  const withQueueLength = await Promise.all(doctors.map(async ({ doctor, departmentName }) => {
    const queue = await db
      .select()
      .from(queueTokensTable)
      .where(and(eq(queueTokensTable.doctorId, doctor.id), eq(queueTokensTable.status, "waiting")));
    return {
      ...doctor,
      departmentName: departmentName ?? null,
      queueLength: queue.length,
    };
  }));

  res.json(withQueueLength);
});

router.post("/doctors", async (req, res): Promise<void> => {
  const parsed = CreateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doctor] = await db.insert(doctorsTable).values(parsed.data as any).returning();
  res.status(201).json({ ...doctor, departmentName: null, queueLength: 0 });
});

router.get("/doctors/:id", async (req, res): Promise<void> => {
  const params = GetDoctorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({ doctor: doctorsTable, departmentName: departmentsTable.name })
    .from(doctorsTable)
    .leftJoin(departmentsTable, eq(doctorsTable.departmentId, departmentsTable.id))
    .where(eq(doctorsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  const queue = await db
    .select()
    .from(queueTokensTable)
    .where(and(eq(queueTokensTable.doctorId, params.data.id), eq(queueTokensTable.status, "waiting")));

  res.json({ ...row.doctor, departmentName: row.departmentName ?? null, queueLength: queue.length });
});

router.patch("/doctors/:id", async (req, res): Promise<void> => {
  const params = UpdateDoctorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doctor] = await db
    .update(doctorsTable)
    .set(parsed.data as any)
    .where(eq(doctorsTable.id, params.data.id))
    .returning();

  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, doctor.departmentId));
  const queue = await db
    .select()
    .from(queueTokensTable)
    .where(and(eq(queueTokensTable.doctorId, doctor.id), eq(queueTokensTable.status, "waiting")));

  res.json({ ...doctor, departmentName: dept?.name ?? null, queueLength: queue.length });
});

router.get("/doctors/:id/queue", async (req, res): Promise<void> => {
  const params = GetDoctorQueueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const tokens = await db
    .select()
    .from(queueTokensTable)
    .where(and(eq(queueTokensTable.doctorId, params.data.id), eq(queueTokensTable.status, "waiting")))
    .orderBy(queueTokensTable.priority, queueTokensTable.issuedAt);

  const enriched = await Promise.all(tokens.map(async (token, idx) => {
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, token.patientId));
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, token.departmentId));
    const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, params.data.id));
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

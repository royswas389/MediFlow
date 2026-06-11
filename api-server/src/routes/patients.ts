import { Router, type IRouter } from "express";
import { eq, ilike, or, and } from "drizzle-orm";
import { db, patientsTable, activityEventsTable } from "@workspace/db";
import {
  ListPatientsQueryParams,
  RegisterPatientBody,
  GetPatientParams,
  UpdatePatientParams,
  UpdatePatientBody,
  GetPatientTokenParams,
} from "@workspace/api-zod";
import { queueTokensTable, departmentsTable, doctorsTable } from "@workspace/db";

const router: IRouter = Router();

function generateHospitalId(): string {
  const prefix = "MF";
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${num}`;
}

router.get("/patients", async (req, res): Promise<void> => {
  const parsed = ListPatientsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, status, limit = 50, offset = 0 } = parsed.data;

  const conditions = [];
  if (search) {
    conditions.push(or(ilike(patientsTable.name, `%${search}%`), ilike(patientsTable.phone, `%${search}%`)));
  }
  if (status) {
    conditions.push(eq(patientsTable.status, status as any));
  }

  const rows = await db
    .select()
    .from(patientsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(Number(limit))
    .offset(Number(offset))
    .orderBy(patientsTable.createdAt);

  res.json(rows);
});

router.post("/patients", async (req, res): Promise<void> => {
  const parsed = RegisterPatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const hospitalId = generateHospitalId();
  const [patient] = await db
    .insert(patientsTable)
    .values({ ...parsed.data, hospitalId })
    .returning();

  await db.insert(activityEventsTable).values({
    type: "registration",
    description: `New patient registered: ${patient.name}`,
    patientName: patient.name,
    patientId: patient.id,
  });

  res.status(201).json(patient);
});

router.get("/patients/:id", async (req, res): Promise<void> => {
  const params = GetPatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, params.data.id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.json(patient);
});

router.patch("/patients/:id", async (req, res): Promise<void> => {
  const params = UpdatePatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db
    .update(patientsTable)
    .set(parsed.data as any)
    .where(eq(patientsTable.id, params.data.id))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.json(patient);
});

router.get("/patients/:id/token", async (req, res): Promise<void> => {
  const params = GetPatientTokenParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [token] = await db
    .select()
    .from(queueTokensTable)
    .where(and(eq(queueTokensTable.patientId, params.data.id), eq(queueTokensTable.status, "waiting")))
    .orderBy(queueTokensTable.issuedAt)
    .limit(1);

  if (!token) {
    res.status(404).json({ error: "No active token found for patient" });
    return;
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, token.patientId));
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, token.departmentId));
  const doctor = token.doctorId
    ? (await db.select().from(doctorsTable).where(eq(doctorsTable.id, token.doctorId)))[0]
    : null;

  const waitingAhead = await db
    .select()
    .from(queueTokensTable)
    .where(
      and(
        eq(queueTokensTable.departmentId, token.departmentId),
        eq(queueTokensTable.status, "waiting")
      )
    );

  const position = waitingAhead.filter(t => t.priority < token.priority || (t.priority === token.priority && t.id < token.id)).length + 1;

  res.json({
    ...token,
    patientName: patient?.name ?? "Unknown",
    departmentName: dept?.name ?? null,
    doctorName: doctor?.name ?? null,
    position,
  });
});

export default router;

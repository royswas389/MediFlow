import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, queueTokensTable, patientsTable, departmentsTable, doctorsTable, activityEventsTable } from "@workspace/db";
import {
  ListTokensQueryParams,
  IssueTokenBody,
  GetTokenParams,
  UpdateTokenParams,
  UpdateTokenBody,
  EscalateToEmergencyParams,
  GetWaitTimePredictionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateTokenNumber(departmentCode: string, count: number): string {
  return `${departmentCode}-${String(count + 1).padStart(3, "0")}`;
}

async function enrichToken(token: typeof queueTokensTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, token.patientId));
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, token.departmentId));
  const doctor = token.doctorId
    ? (await db.select().from(doctorsTable).where(eq(doctorsTable.id, token.doctorId)))[0]
    : null;

  const waitingAhead = await db
    .select()
    .from(queueTokensTable)
    .where(and(eq(queueTokensTable.departmentId, token.departmentId), eq(queueTokensTable.status, "waiting")));

  const position = waitingAhead.filter(
    t => t.priority < token.priority || (t.priority === token.priority && t.id < token.id)
  ).length + 1;

  return {
    ...token,
    patientName: patient?.name ?? "Unknown",
    departmentName: dept?.name ?? null,
    doctorName: doctor?.name ?? null,
    position,
  };
}

router.get("/queue/tokens", async (req, res): Promise<void> => {
  const parsed = ListTokensQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conditions = [];
  if (parsed.data.departmentId) conditions.push(eq(queueTokensTable.departmentId, Number(parsed.data.departmentId)));
  if (parsed.data.doctorId) conditions.push(eq(queueTokensTable.doctorId, Number(parsed.data.doctorId)));
  if (parsed.data.status) conditions.push(eq(queueTokensTable.status, parsed.data.status as any));

  const tokens = await db
    .select()
    .from(queueTokensTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(queueTokensTable.priority, queueTokensTable.issuedAt);

  const enriched = await Promise.all(tokens.map(enrichToken));
  res.json(enriched);
});

router.post("/queue/tokens", async (req, res): Promise<void> => {
  const parsed = IssueTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, parsed.data.patientId ? parsed.data.departmentId : 0));
  const [department] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, parsed.data.departmentId));
  if (!department) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  const existing = await db.select().from(queueTokensTable).where(eq(queueTokensTable.departmentId, parsed.data.departmentId));
  const tokenNumber = generateTokenNumber(department.code, existing.length);

  const triageCategory = parsed.data.triageCategory ?? "normal";
  const priority = triageCategory === "emergency" ? 1 : triageCategory === "urgent" ? 50 : 100;

  const avgWait = department.avgWaitMinutes ?? 15;
  const waitingCount = existing.filter(t => t.status === "waiting").length;
  const estimatedWait = waitingCount * avgWait;

  const [token] = await db
    .insert(queueTokensTable)
    .values({
      tokenNumber,
      patientId: parsed.data.patientId,
      departmentId: parsed.data.departmentId,
      doctorId: parsed.data.doctorId ?? null,
      triageCategory: triageCategory as any,
      priority,
      estimatedWaitMinutes: estimatedWait,
    })
    .returning();

  await db.update(departmentsTable)
    .set({ currentLoad: (department.currentLoad ?? 0) + 1 })
    .where(eq(departmentsTable.id, parsed.data.departmentId));

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, parsed.data.patientId));
  await db.insert(activityEventsTable).values({
    type: "token_issued",
    description: `Token ${tokenNumber} issued to ${patient?.name ?? "patient"} for ${department.name}`,
    patientName: patient?.name ?? null,
    departmentName: department.name,
    patientId: parsed.data.patientId,
  });

  res.status(201).json(await enrichToken(token));
});

router.get("/queue/tokens/:id", async (req, res): Promise<void> => {
  const params = GetTokenParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [token] = await db.select().from(queueTokensTable).where(eq(queueTokensTable.id, params.data.id));
  if (!token) {
    res.status(404).json({ error: "Token not found" });
    return;
  }

  res.json(await enrichToken(token));
});

router.patch("/queue/tokens/:id", async (req, res): Promise<void> => {
  const params = UpdateTokenParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "called") updates.calledAt = new Date();
  if (parsed.data.status === "completed") updates.completedAt = new Date();

  const [token] = await db
    .update(queueTokensTable)
    .set(updates as any)
    .where(eq(queueTokensTable.id, params.data.id))
    .returning();

  if (!token) {
    res.status(404).json({ error: "Token not found" });
    return;
  }

  if (parsed.data.status === "called" || parsed.data.status === "completed") {
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, token.patientId));
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, token.departmentId));
    const type = parsed.data.status === "completed" ? "completed" : "called";
    await db.insert(activityEventsTable).values({
      type,
      description: `${patient?.name ?? "Patient"} ${parsed.data.status === "completed" ? "consultation completed" : "called to " + (dept?.name ?? "department")}`,
      patientName: patient?.name ?? null,
      departmentName: dept?.name ?? null,
      patientId: token.patientId,
    });
  }

  res.json(await enrichToken(token));
});

router.post("/queue/tokens/:id/emergency", async (req, res): Promise<void> => {
  const params = EscalateToEmergencyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [token] = await db
    .update(queueTokensTable)
    .set({ status: "emergency", priority: 1, triageCategory: "emergency" } as any)
    .where(eq(queueTokensTable.id, params.data.id))
    .returning();

  if (!token) {
    res.status(404).json({ error: "Token not found" });
    return;
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, token.patientId));
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, token.departmentId));

  await db.insert(activityEventsTable).values({
    type: "emergency",
    description: `EMERGENCY escalation: ${patient?.name ?? "Patient"} in ${dept?.name ?? "department"}`,
    patientName: patient?.name ?? null,
    departmentName: dept?.name ?? null,
    patientId: token.patientId,
  });

  res.json(await enrichToken(token));
});

router.get("/queue/wait-time/:departmentId", async (req, res): Promise<void> => {
  const params = GetWaitTimePredictionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, params.data.departmentId));
  if (!dept) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  const waitingTokens = await db
    .select()
    .from(queueTokensTable)
    .where(and(eq(queueTokensTable.departmentId, params.data.departmentId), eq(queueTokensTable.status, "waiting")));

  const queueLength = waitingTokens.length;
  const avgConsult = dept.avgWaitMinutes ?? 12;
  const hour = new Date().getHours();
  const peakMultiplier = (hour >= 9 && hour <= 11) || (hour >= 16 && hour <= 18) ? 1.3 : 1.0;
  const estimatedMinutes = Math.ceil(queueLength * avgConsult * peakMultiplier);

  const factors = [];
  if (queueLength > dept.capacity * 0.7) factors.push("High department load");
  if (peakMultiplier > 1) factors.push("Peak hours");
  if (waitingTokens.some(t => t.triageCategory === "emergency")) factors.push("Emergency cases in queue");

  res.json({
    departmentId: params.data.departmentId,
    estimatedMinutes,
    queueLength,
    confidence: Math.max(0.6, 0.95 - queueLength * 0.02),
    factors,
  });
});

export default router;

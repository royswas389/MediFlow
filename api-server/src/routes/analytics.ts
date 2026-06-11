import { Router, type IRouter } from "express";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  db, patientsTable, queueTokensTable, departmentsTable, doctorsTable,
  triageResultsTable, appointmentsTable, activityEventsTable
} from "@workspace/db";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [patientsToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(patientsTable)
    .where(gte(patientsTable.createdAt, today));

  const activeTokens = await db
    .select()
    .from(queueTokensTable)
    .where(eq(queueTokensTable.status, "waiting"));

  const emergencyTokens = await db
    .select()
    .from(queueTokensTable)
    .where(eq(queueTokensTable.status, "emergency"));

  const departments = await db.select().from(departmentsTable);
  const overloaded = departments.filter(d => d.status === "overloaded").length;

  const doctors = await db.select().from(doctorsTable);
  const available = doctors.filter(d => d.status === "available").length;

  const apptToday = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(gte(appointmentsTable.scheduledAt, today));

  const completed = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(queueTokensTable)
    .where(and(eq(queueTokensTable.status, "completed"), gte(queueTokensTable.issuedAt, today)));

  const avgWait = activeTokens.length > 0
    ? Math.round(activeTokens.reduce((sum, t) => sum + (t.estimatedWaitMinutes ?? 0), 0) / activeTokens.length)
    : 0;

  res.json({
    totalPatientsToday: patientsToday[0]?.count ?? 0,
    activeTokens: activeTokens.length,
    avgWaitMinutes: avgWait,
    emergencyCount: emergencyTokens.length,
    departmentsOverloaded: overloaded,
    doctorsAvailable: available,
    appointmentsToday: apptToday[0]?.count ?? 0,
    completedToday: completed[0]?.count ?? 0,
    peakHour: "10:00 AM",
  });
});

router.get("/analytics/congestion", async (_req, res): Promise<void> => {
  const departments = await db.select().from(departmentsTable);

  const congestion = await Promise.all(departments.map(async (dept) => {
    const waiting = await db
      .select()
      .from(queueTokensTable)
      .where(and(eq(queueTokensTable.departmentId, dept.id), eq(queueTokensTable.status, "waiting")));

    const ratio = waiting.length / Math.max(dept.capacity, 1);
    let congestionLevel: "low" | "moderate" | "high" | "critical";
    if (ratio < 0.3) congestionLevel = "low";
    else if (ratio < 0.6) congestionLevel = "moderate";
    else if (ratio < 0.9) congestionLevel = "high";
    else congestionLevel = "critical";

    const trend = waiting.length > dept.currentLoad ? "increasing" : waiting.length < dept.currentLoad ? "decreasing" : "stable";

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      congestionLevel,
      queueLength: waiting.length,
      capacity: dept.capacity,
      waitMinutes: dept.avgWaitMinutes,
      trend,
    };
  }));

  res.json(congestion);
});

router.get("/analytics/hourly-flow", async (_req, res): Promise<void> => {
  const hourLabels = ["12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","10am","11am",
    "12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm"];

  const baseCounts = [2,1,1,0,0,1,3,8,15,22,28,25,20,18,22,26,24,20,15,10,7,5,3,2];
  const currentHour = new Date().getHours();

  const flow = hourLabels.map((label, hour) => ({
    hour,
    label,
    count: hour <= currentHour ? baseCounts[hour] + Math.floor(Math.random() * 4 - 1) : 0,
  }));

  res.json(flow);
});

router.get("/analytics/triage-breakdown", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results = await db
    .select()
    .from(triageResultsTable)
    .where(gte(triageResultsTable.createdAt, today));

  const emergency = results.filter(r => r.category === "emergency").length;
  const urgent = results.filter(r => r.category === "urgent").length;
  const normal = results.filter(r => r.category === "normal").length;

  res.json({ emergency, urgent, normal, total: results.length });
});

router.get("/analytics/doctor-workload", async (_req, res): Promise<void> => {
  const doctors = await db
    .select({ doctor: doctorsTable, departmentName: departmentsTable.name })
    .from(doctorsTable)
    .leftJoin(departmentsTable, eq(doctorsTable.departmentId, departmentsTable.id))
    .orderBy(doctorsTable.name);

  const workload = await Promise.all(doctors.map(async ({ doctor, departmentName }) => {
    const queue = await db
      .select()
      .from(queueTokensTable)
      .where(and(eq(queueTokensTable.doctorId, doctor.id), eq(queueTokensTable.status, "waiting")));

    return {
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      departmentName: departmentName ?? "",
      queueLength: queue.length,
      consultationsToday: doctor.consultationsToday,
      status: doctor.status,
      avgConsultationMinutes: doctor.avgConsultationMinutes,
    };
  }));

  res.json(workload);
});

router.get("/analytics/recent-activity", async (req, res): Promise<void> => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = Number(parsed.data.limit ?? 20);
  const events = await db
    .select()
    .from(activityEventsTable)
    .orderBy(activityEventsTable.timestamp)
    .limit(limit);

  res.json(events);
});

export default router;

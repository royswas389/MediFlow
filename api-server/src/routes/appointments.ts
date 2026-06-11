import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, appointmentsTable, patientsTable, doctorsTable, departmentsTable, activityEventsTable } from "@workspace/db";
import {
  ListAppointmentsQueryParams,
  BookAppointmentBody,
  GetAppointmentParams,
  UpdateAppointmentParams,
  UpdateAppointmentBody,
  CancelAppointmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichAppointment(appt: typeof appointmentsTable.$inferSelect) {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, appt.patientId));
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, appt.doctorId));
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, appt.departmentId));
  return {
    ...appt,
    patientName: patient?.name ?? "Unknown",
    doctorName: doctor?.name ?? "Unknown",
    departmentName: dept?.name ?? null,
  };
}

router.get("/appointments", async (req, res): Promise<void> => {
  const parsed = ListAppointmentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const conditions = [];
  if (parsed.data.patientId) conditions.push(eq(appointmentsTable.patientId, Number(parsed.data.patientId)));
  if (parsed.data.doctorId) conditions.push(eq(appointmentsTable.doctorId, Number(parsed.data.doctorId)));
  if (parsed.data.status) conditions.push(eq(appointmentsTable.status, parsed.data.status as any));

  const appts = await db
    .select()
    .from(appointmentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(appointmentsTable.scheduledAt);

  const enriched = await Promise.all(appts.map(enrichAppointment));
  res.json(enriched);
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = BookAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [appt] = await db.insert(appointmentsTable).values(parsed.data as any).returning();
  const enriched = await enrichAppointment(appt);

  await db.insert(activityEventsTable).values({
    type: "appointment",
    description: `Appointment booked for ${enriched.patientName} with Dr. ${enriched.doctorName}`,
    patientName: enriched.patientName,
    departmentName: enriched.departmentName ?? undefined,
    patientId: appt.patientId,
  });

  res.status(201).json(enriched);
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const params = GetAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, params.data.id));
  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(await enrichAppointment(appt));
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const params = UpdateAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [appt] = await db
    .update(appointmentsTable)
    .set(parsed.data as any)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(await enrichAppointment(appt));
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const params = CancelAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .update(appointmentsTable)
    .set({ status: "cancelled" })
    .where(eq(appointmentsTable.id, params.data.id));

  res.sendStatus(204);
});

export default router;

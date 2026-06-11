import { Router, type IRouter } from "express";
import { db, triageResultsTable, patientsTable, departmentsTable, activityEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  TriagePatientBody,
  ListTriageHistoryQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function classifyTriage(symptoms: string, age?: number | null): {
  category: "emergency" | "urgent" | "normal";
  riskScore: number;
  reasoning: string;
  recommendedDepartment: string;
} {
  const s = symptoms.toLowerCase();
  const emergencyKeywords = ["chest pain", "heart attack", "stroke", "unconscious", "severe bleeding", "difficulty breathing", "choking", "seizure", "anaphylaxis", "trauma"];
  const urgentKeywords = ["high fever", "fracture", "sprain", "abdominal pain", "vomiting blood", "severe headache", "allergic reaction", "infection", "laceration"];

  const hasEmergency = emergencyKeywords.some(k => s.includes(k));
  const hasUrgent = urgentKeywords.some(k => s.includes(k));

  const ageRisk = age && (age < 5 || age > 70) ? 0.15 : 0;

  if (hasEmergency) {
    const riskScore = Math.min(1, 0.85 + ageRisk + Math.random() * 0.1);
    return {
      category: "emergency",
      riskScore,
      reasoning: `Symptoms indicate a life-threatening condition requiring immediate intervention. Keywords matched: ${emergencyKeywords.filter(k => s.includes(k)).join(", ")}. ${age && age > 70 ? "Advanced age increases risk." : ""}`,
      recommendedDepartment: "Emergency",
    };
  } else if (hasUrgent) {
    const riskScore = Math.min(0.84, 0.55 + ageRisk + Math.random() * 0.2);
    const deptMap: Record<string, string> = {
      "fracture": "Orthopedics",
      "sprain": "Orthopedics",
      "abdominal pain": "General Surgery",
      "vomiting blood": "Gastroenterology",
      "severe headache": "Neurology",
      "high fever": "General Medicine",
    };
    const matched = urgentKeywords.find(k => s.includes(k));
    return {
      category: "urgent",
      riskScore,
      reasoning: `Symptoms require prompt medical attention but are not immediately life-threatening. ${age && age < 5 ? "Pediatric age group requires careful monitoring." : ""}`,
      recommendedDepartment: (matched && deptMap[matched]) || "General Medicine",
    };
  } else {
    const riskScore = Math.min(0.54, 0.1 + ageRisk + Math.random() * 0.3);
    return {
      category: "normal",
      riskScore,
      reasoning: "Symptoms appear to be non-urgent. Routine consultation recommended. Monitor for any escalation.",
      recommendedDepartment: "General Medicine",
    };
  }
}

router.post("/triage", async (req, res): Promise<void> => {
  const parsed = TriagePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, parsed.data.patientId));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const age = parsed.data.age ?? patient.age;
  const result = classifyTriage(parsed.data.symptoms, age);

  const [triageResult] = await db
    .insert(triageResultsTable)
    .values({
      patientId: parsed.data.patientId,
      category: result.category,
      riskScore: result.riskScore,
      reasoning: result.reasoning,
      symptoms: parsed.data.symptoms,
      recommendedDepartment: result.recommendedDepartment,
    })
    .returning();

  await db.insert(activityEventsTable).values({
    type: "triage",
    description: `Triage: ${patient.name} classified as ${result.category.toUpperCase()} (risk: ${(result.riskScore * 100).toFixed(0)}%)`,
    patientName: patient.name,
    patientId: patient.id,
  });

  res.json({ ...triageResult, patientName: patient.name });
});

router.get("/triage/history", async (req, res): Promise<void> => {
  const parsed = ListTriageHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = Number(parsed.data.limit ?? 20);
  const results = await db
    .select()
    .from(triageResultsTable)
    .orderBy(triageResultsTable.createdAt)
    .limit(limit);

  const enriched = await Promise.all(results.map(async (r) => {
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, r.patientId));
    return { ...r, patientName: patient?.name ?? null };
  }));

  res.json(enriched);
});

export default router;

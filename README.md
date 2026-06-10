# MediFlow AI

A Hospital Flow Intelligence Platform that predicts, optimizes, and manages patient flow across hospitals — combining smart queue management, AI triage, real-time congestion monitoring, and operational dashboards.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mediflow run dev` — run the frontend (port 24378)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, TanStack React Query, Recharts, Framer Motion, Wouter
- API: Express 5, Zod validation
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table schemas (patients, departments, doctors, tokens, triage, appointments, activity)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/mediflow/src/` — React frontend

## Architecture decisions

- Contract-first API: OpenAPI spec gates codegen which gates the frontend; never hand-write types the codegen produces.
- Rule-based AI triage: Symptom keyword matching with age risk scoring instead of ML dependency; can be swapped for real model later.
- Enriched response pattern: DB rows joined with related entities server-side (patient name, dept name, doctor name) to keep frontend simple.
- Activity event log: Every significant action (registration, token issue, escalation, triage) writes to `activity_events` for the live feed.
- Auto-refresh: All React Query hooks use `refetchInterval: 30000` for live updates.

## Product

- **Patient flow**: Role-based landing → patient registration → token issuance → live queue tracker
- **Operations center** (`/admin`): Real-time KPIs, department congestion heatmap, live activity feed
- **Departments** (`/admin/departments`): Status, queue load, avg wait times
- **Doctor roster** (`/admin/doctors`): Availability, workload, queue lengths
- **Analytics** (`/admin/analytics`): Hourly patient flow chart, triage breakdown, doctor workload
- **Doctor dashboard** (`/doctor/:id`): Personal queue with call/complete/escalate actions
- **AI Triage** (`/triage`): Symptom input → emergency/urgent/normal classification with risk score
- **Appointments** (`/appointments`): Book and manage appointments

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before writing route handlers
- Drizzle schema enums must match OpenAPI enum values exactly
- The `analytics/summary` `totalPatientsToday` counts from `patients.createdAt` — if seeding with backdated timestamps, adjust the query accordingly

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

# Neighborhood Navigator: From MVP to Production Civic Tool

## Context

Villages CDC executive director will pass a finished product to other Detroit CDCs. $63M/year flows through 30+ home repair organizations with no real-time tracking. VCDC is piloting Zoho for case management. The tool needs to: (1) screen residents for program eligibility, (2) bridge intake to whatever CRM a CDC uses, and (3) produce gap analysis data that justifies funding.

Building all three phases. Supabase for the database (Postgres + built-in auth + row-level security). Cron ping to prevent free-tier pausing.

---

## Phase 1: Production-Quality Screener

Everything stays static. No backend changes. Goal: a tool VCDC puts their name on.

### 1.1 Branding configuration
- New: `src/config/branding.ts` — reads from env vars, falls back to defaults
- New: `src/config/defaults.ts` — current hardcoded values extracted
- Modify: `src/app/layout.tsx` — use config instead of hardcoded strings
- Modify: `src/app/globals.css` — CSS custom properties driven by config

### 1.2 OG meta tags for social sharing
- Modify: `src/app/layout.tsx` — add openGraph and twitter card metadata
- Modify: `src/app/[city]/page.tsx` — add `generateMetadata` with city name
- New: `public/og-image.png` (1200x630)
- Add favicon and apple-touch-icon to `public/`

### 1.3 Add missing programs
- Modify: `src/data/detroit/programs.json`
- Add: Detroit Home Repair Fund ($20M, Gilbert/ProMedica/DTE, 14K waitlist)
- Add: Detroit 0% Home Repair Loans ($5K-$25K, city program)
- Verify: Renew Detroit entry current (phases closed)
- No schema changes — follows existing `Program` interface

### 1.4 Privacy-respecting analytics
- New: `src/lib/analytics.ts` — Plausible wrapper, no-ops if not loaded
- Modify: `src/app/layout.tsx` — Plausible script tag
- Track: step completions, results shown, program card expansions, print, HOPE usage
- Update privacy notice accordingly

### 1.5 UI polish
- Modify: `src/components/Screener.tsx` — clearer CTA on step 4, scroll-to-top on step change
- Modify: `src/components/StepIndicator.tsx` — mobile label visibility
- Modify: `src/components/ProgramCard.tsx` — SVG chevron
- Modify: `src/app/page.tsx` — larger mobile touch target on ZIP input

### 1.6 PWA basics
- New: `public/manifest.json`, `public/icons/icon-192.png`, `icon-512.png`
- Minimal service worker for offline caching of static assets

---

## Phase 2: Intake Bridge + CRM Integration

Optional server-side layer. Screener stays static. Server calls only on explicit resident opt-in.

### 2.1 Architecture

Keep `output: "export"` in next.config.ts. Add `/api` directory at project root. Vercel deploys these as serverless functions alongside the static site.

New dependencies: `@vercel/node`, `@supabase/supabase-js`, `resend`

### 2.2 Database: Supabase

Two tables + a keep-alive cron:

**`screenings`** (anonymized, no PII):

- id (uuid PK), tenant_slug (text, indexed, nullable), zip (text), household_size (int), income_range (text), housing_status (text), matched_program_ids (text[]), match_count (int), strong_count (int), likely_count (int), opted_into_intake (boolean), created_at (timestamptz)

**`intakes`** (PII, tenant-restricted via RLS):

- id (uuid PK), tenant_slug (text, indexed), first_name (text), phone (text), email (text nullable), contact_method (text), screening_inputs (jsonb), matched_programs (jsonb), status (text: new/contacted/applied/served/declined), crm_synced (boolean), crm_reference (text nullable), created_at (timestamptz)

**Row-level security:**
- `intakes`: authenticated users read only where `tenant_slug` matches their JWT custom claim. Service role inserts.
- `screenings`: authenticated dashboard users read for their tenant. Admin reads all. Service role inserts.

**Keep-alive:** `/api/keep-alive.ts` — a simple endpoint that queries Supabase (`SELECT 1`). Vercel cron runs it daily via `vercel.json` cron config. Prevents 7-day inactivity pause.

### 2.3 Anonymous screening events

- New: `/api/screening-event.ts` — POST, writes to `screenings` table
- Modify: `src/components/Screener.tsx` — `navigator.sendBeacon()` on results load
- Fire-and-forget. No user impact if it fails.

### 2.4 Intake form component

- New: `src/components/IntakeForm.tsx`
- Appears on step 4 below results, only when tenant config has `intakeEnabled: true`
- Collects: first name, phone, preferred contact method, explicit consent checkbox naming the CDC
- POSTs to `/api/intake.ts`
- Success: "Someone from [CDC name] will contact you within [X] business days"
- Error: shows CDC phone number as fallback

### 2.5 Zoho CRM integration

- New: `/api/lib/zoho.ts` — OAuth2 token management, creates Lead/Contact with screening results as note
- Env vars: `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`
- On failure: `crm_synced = false` in Supabase, retry via `/api/retry-sync.ts`

### 2.6 Google Sheets fallback

- New: `/api/lib/sheets.ts` — service account auth, appends row
- Per-tenant spreadsheet ID in tenant config

### 2.7 Email notification

- `/api/intake.ts` sends notification to program manager via Resend (100/day free)
- Simple plain-text email: resident name, phone, matched programs, link to Supabase/CRM record

### 2.8 Tenant configuration

- New: `src/data/tenants/villages-cdc.json` — slug, name, city, crmType, intakeEnabled, contactPromise, managerEmail, branding overrides
- New: `src/config/tenant.ts` — loads and validates
- Screener URL: `/{city}?org=villages-cdc` or `/{city}` for generic

---

## Phase 3: Gap Analysis Dashboard

CDC staff and funders see the data that proves impact and identifies gaps.

### 3.1 Dashboard pages

All client-side (Supabase JS client + auth in browser). Static export stays intact.

- New: `src/app/dashboard/page.tsx` — login + overview
- New: `src/app/dashboard/screenings/page.tsx` — volume and trends
- New: `src/app/dashboard/programs/page.tsx` — match rates by program
- New: `src/app/dashboard/gap/page.tsx` — screened vs. served

### 3.2 Auth

- Supabase Auth with magic link email. No passwords.
- New: `src/components/dashboard/LoginGate.tsx`
- Staff invited by email. Tenant role set as custom claim.

### 3.3 Dashboard components

- `OverviewCards.tsx` — total screenings, intake conversion rate, top programs
- `ScreeningChart.tsx` — volume over time
- `ProgramMatchTable.tsx` — program match frequency, strong vs. likely
- `GeoDistribution.tsx` — ZIP-level breakdown
- `GapAnalysis.tsx` — screened vs. served comparison

New dependency: `recharts` for charts

### 3.4 Gap analysis

Postgres makes this straightforward:

```sql
SELECT
  p.program_id,
  p.program_name,
  COUNT(DISTINCT s.id) AS matched_count,
  COUNT(DISTINCT CASE WHEN i.status = 'applied' THEN i.id END) AS applied_count,
  COUNT(DISTINCT CASE WHEN i.status = 'served' THEN i.id END) AS served_count,
  COUNT(DISTINCT s.id) - COUNT(DISTINCT i.id) AS unmet_gap
FROM screenings s
LEFT JOIN intakes i ON i.tenant_slug = s.tenant_slug
WHERE s.tenant_slug = $1
GROUP BY p.program_id, p.program_name
```

This is exactly why Supabase/Postgres is the right choice. These aggregate queries would be painful in Firestore.

### 3.5 Outcome data ingestion

- CSV upload first (works regardless of CRM): `/api/upload-outcomes.ts`
- Dashboard drag-and-drop UI
- New dependency: `papaparse`
- Later: Zoho webhook + Sheets sync as upgrades

### 3.6 Exportable reports

- "Export CSV" and "Print Report" on dashboard pages
- Generates quarterly funder format: residents screened, programs matched, applications, outcomes, unmet need by program and ZIP

---

## Not Included (intentionally)

- Custom CRM (Zoho handles this)
- Resident accounts
- Multi-city expansion (Detroit only for now)
- Native mobile app (PWA sufficient)
- Admin UI for program data (stays in git)

---

## Files Modified

| File | Phase | Changes |
|------|-------|---------|
| `src/app/layout.tsx` | 1 | Branding config, OG tags, Plausible, PWA manifest |
| `src/app/[city]/page.tsx` | 1 | generateMetadata |
| `src/app/globals.css` | 1 | Config-driven CSS vars |
| `src/components/Screener.tsx` | 1, 2 | UI polish, analytics, intake form, screening beacon |
| `src/components/StepIndicator.tsx` | 1 | Mobile labels |
| `src/components/ProgramCard.tsx` | 1 | SVG chevron |
| `src/data/detroit/programs.json` | 1 | Add missing programs |

## New Files

| File | Phase |
|------|-------|
| `src/config/branding.ts`, `src/config/defaults.ts` | 1 |
| `src/lib/analytics.ts` | 1 |
| `public/manifest.json`, `public/og-image.png`, `public/icons/*` | 1 |
| `vercel.json` | 2 |
| `/api/intake.ts`, `/api/screening-event.ts`, `/api/keep-alive.ts` | 2 |
| `/api/lib/zoho.ts`, `/api/lib/sheets.ts`, `/api/lib/supabase.ts` | 2 |
| `src/components/IntakeForm.tsx` | 2 |
| `src/config/tenant.ts`, `src/data/tenants/villages-cdc.json` | 2 |
| `src/lib/supabase-client.ts` | 3 |
| `src/app/dashboard/page.tsx` | 3 |
| `src/app/dashboard/screenings/page.tsx` | 3 |
| `src/app/dashboard/programs/page.tsx` | 3 |
| `src/app/dashboard/gap/page.tsx` | 3 |
| `src/components/dashboard/LoginGate.tsx` | 3 |
| `src/components/dashboard/OverviewCards.tsx` | 3 |
| `src/components/dashboard/ScreeningChart.tsx` | 3 |
| `src/components/dashboard/ProgramMatchTable.tsx` | 3 |
| `src/components/dashboard/GeoDistribution.tsx` | 3 |
| `src/components/dashboard/GapAnalysis.tsx` | 3 |
| `/api/upload-outcomes.ts` | 3 |

## New Dependencies

| Package | Phase | Purpose |
|---------|-------|---------|
| `@vercel/node` | 2 | Serverless function types |
| `@supabase/supabase-js` | 2 | Database client (server + client) |
| `resend` | 2 | Email notifications |
| `recharts` | 3 | Dashboard charts |
| `papaparse` | 3 | CSV parsing |

## Verification

**Phase 1:**
- `npm run build` succeeds (static export)
- OG tags correct (opengraph.xyz)
- Plausible events fire (browser network tab)
- PWA installs on Android Chrome
- New programs appear for matching resident profiles
- Print layout works

**Phase 2:**
- Screener → intake form → record in Supabase `intakes` table
- Record syncs to Zoho or appends to Google Sheet
- Program manager gets email via Resend
- Anonymous screening event in `screenings` table (no PII)
- Intake form only shows when `intakeEnabled: true`
- Keep-alive cron prevents Supabase pausing

**Phase 3:**
- Magic link login works
- Dashboard shows correct counts
- CSV upload updates intake statuses
- Gap analysis: screened vs. served per program
- Tenant isolation: CDC A can't see CDC B
- Export CSV produces usable output

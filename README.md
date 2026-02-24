# Neighborhood Navigator

A browser-based tool that helps residents discover and apply for housing assistance, tax relief, utility programs, and community resources they qualify for. Residents answer 10 simple questions and get a personalized, printable list of programs with application guidance.

Built for community development corporations (CDCs) and neighborhood organizations. Designed to work at community events on a tablet, on a resident's phone, or from a shared link on social media.

## The Problem

Municipal assistance programs exist for property tax relief, home repair, lead abatement, utility assistance, and more. Most residents who qualify don't know these programs exist. The information is scattered across dozens of agency websites, buried in PDFs, and changes frequently. CDC staff carry this knowledge in their heads, which means it doesn't scale and walks out the door when they leave.

The result: residents lose homes to tax foreclosure when they qualified for exemptions. They pay full utility bills when assistance was available. Properties deteriorate when free repair programs had open slots. Population loss accelerates because the safety net exists but nobody can find it.

## The Solution

A static website with a structured program database and client-side matching logic. No accounts, no server, no stored data. A resident answers questions about their situation and gets back a ranked list of programs they likely qualify for, with everything they need to take action.

## Architecture

```
neighborhood-navigator/
├── public/
│   ├── index.html                  # Home page + city selector
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   └── [city]/
│   │       ├── page.tsx            # City screener (intake questions)
│   │       └── results/
│   │           └── page.tsx        # Results display
│   ├── components/
│   │   ├── IntakeForm.tsx          # Multi-step intake form
│   │   ├── StepIndicator.tsx       # Progress bar (Step 1 of 4)
│   │   ├── ProgramCard.tsx         # Individual program result
│   │   ├── ResultsGroup.tsx        # Category-grouped results
│   │   ├── PrintableResults.tsx    # Print/PDF layout
│   │   └── DocumentChecklist.tsx   # Deduplicated docs needed
│   ├── lib/
│   │   ├── matcher.ts              # Eligibility matching engine
│   │   ├── types.ts                # TypeScript interfaces
│   │   └── utils.ts                # Helpers (FPL lookup, formatting)
│   └── data/
│       └── detroit/
│           ├── programs.json       # Program database (the core asset)
│           └── meta.json           # City metadata (name, zips, contacts)
├── docs/
│   ├── data-collection-guide.md    # How to research and structure programs
│   ├── program-schema.md           # Program data format specification
│   └── adding-a-city.md            # How to add a new locale
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

### Tech Stack

- **Next.js** (static export) — generates a static site, no server runtime
- **TypeScript** — type safety for the matching logic and data schemas
- **Tailwind CSS** — utility-first styling, mobile-first responsive
- **Vercel** (hosting) — free tier, custom domain, automatic SSL, instant deploys from GitHub

### Why Static

All matching logic runs in the browser. The program database ships as JSON bundled into the site. No API calls, no database, no server. This means:

- Zero hosting cost (Vercel free tier)
- No privacy concerns (resident inputs never leave their device)
- Works on slow connections (loads once, runs locally)
- No accounts, no login, no friction
- Offline-capable with a service worker (future)

### Adding a New City

1. Create `src/data/{city}/programs.json` following the schema in `docs/program-schema.md`
2. Create `src/data/{city}/meta.json` with city name, valid ZIP codes, local 211 number
3. Add the city to the home page selector
4. Deploy

Same codebase, different data. The matching engine is locale-agnostic.

---

## MVP: Eligibility Screener

### Intake Flow (4 steps, ~10 questions)

**Step 1 — Your Situation**
- ZIP code (validates against city's ZIP list)
- Housing status: Owner / Renter / Other
- Household size: 1 / 2 / 3 / 4 / 5+

**Step 2 — Your Household**
- Annual household income range: Under $25K / $25-40K / $40-60K / $60-80K / Over $80K
- Veteran in household: Yes / No
- Anyone 62 or older: Yes / No

**Step 3 — Your Home**
- Property type: Single family / Duplex / Apartment / Condo / Mobile home
- Current on property taxes: Yes / No / Not sure
- Property issues (multi-select): Lead paint / Roof or structural / Plumbing or electrical / Heating or insulation / None
- Behind on utility bills: Yes / No

**Step 4 — Your Results**
- Instant results grouped by category
- Each program shows: name, what it covers, estimated benefit, match confidence, documents needed, how to apply
- Print/save button generates a one-page takeaway

### Matching Engine

Each program has structured eligibility rules in JSON. The matcher evaluates resident inputs against each program's rules and returns a match score.

Rule types:
- `income_below` — household income under threshold (adjusted for household size via FPL tables)
- `income_below_ami` — income under Area Median Income percentage
- `is_homeowner` — boolean
- `is_renter` — boolean
- `in_zip_codes` — list of eligible ZIPs
- `property_type_in` — list of eligible property types
- `has_issue` — specific property issue present
- `is_veteran` — boolean
- `is_senior` — boolean (age 62+)
- `tax_status` — current, delinquent, or any

Match confidence:
- **Strong match**: All required rules pass
- **Likely match**: All required rules pass, but income was a range bracket that straddles the threshold
- **Not shown**: Any required rule fails

### Program Database Schema

```json
{
  "id": "detroit-poverty-tax-exemption",
  "name": "Poverty Tax Exemption",
  "agency": "City of Detroit Board of Review",
  "category": "tax-relief",
  "description": "Reduces property taxes for low-income homeowners. Apply annually to the Board of Review.",
  "covers": "Partial or full property tax reduction based on income and property value",
  "max_benefit": "$2,000-$4,000/year depending on taxable value",
  "eligibility": {
    "required": [
      { "type": "is_homeowner" },
      { "type": "in_zip_codes", "values": ["48214", "48215", "..."] },
      { "type": "income_below", "threshold_type": "fpl", "percentage": 200 }
    ],
    "bonus": [
      { "type": "is_senior", "note": "Seniors may qualify for additional exemption" }
    ]
  },
  "required_docs": [
    "Government-issued photo ID",
    "Federal tax return (most recent) or signed income affidavit",
    "Proof of homeownership (deed or land contract)",
    "Current property tax bill"
  ],
  "how_to_apply": {
    "method": "In-person or mail",
    "url": "https://detroitmi.gov/departments/office-chief-financial-officer/ocfo-divisions/office-assessor/board-review",
    "address": "Coleman A. Young Municipal Center, 2 Woodward Ave, Suite 804",
    "phone": "(313) 224-3035",
    "hours": "Board meets March and July. March deadline: [update annually]",
    "notes": "Must reapply every year. Apply in March for same-year relief."
  },
  "funding_status": "open",
  "last_verified": "2026-02-23"
}
```

### Program Categories (Detroit MVP)

| Category | Tag | Target Programs |
|----------|-----|-----------------|
| Tax Relief | `tax-relief` | Poverty exemption, PRE, disabled veteran, HOPE, hardship deferral |
| Home Repair | `home-repair` | Detroit Home Repair loans, MSHDA rehab, Wayne Metro weatherization |
| Lead Abatement | `lead` | Lead Safe Detroit, HUD Lead Hazard Control |
| Utility Assistance | `utility` | LIHEAP, DTE LISSP, WRAP, Consumers Energy assistance |
| Homebuyer Programs | `homebuyer` | MSHDA MI Home Loan, Detroit down payment assistance |
| Foreclosure Prevention | `foreclosure` | Step Forward Michigan, tax foreclosure prevention fund |
| Small Business | `small-business` | Motor City Match, Invest Detroit microloans, DEGC programs |

Target: 30-40 programs total for Detroit launch.

---

## V2: Program Guides

After the screener identifies matching programs, each program card links to a full application guide written in plain language.

### Guide Structure

Each guide answers five questions:

1. **What is this?** One paragraph, no jargon. What the program does in concrete terms.
2. **Do I qualify?** Restated eligibility with the resident's specific numbers from the screener.
3. **What do I need?** Document checklist with explanations of where to get each item if they don't have it.
4. **How do I fill out the form?** Line-by-line walkthrough of the application. Annotated example with fake data showing what a correct submission looks like.
5. **What happens next?** Timeline, what to expect, what to do if denied.

### Guide Content Principles

- Written at 6th-grade reading level (Flesch-Kincaid)
- No acronyms without definition on first use
- Every step is concrete: "Go to this address. Bring these three things. Ask for this person or department."
- Anticipate the 3-5 most common failure points per program (missing documents, name mismatches, deadline confusion)
- Include "What if..." section for common edge cases

### Priority Guides (Build First)

1. Poverty Tax Exemption — highest dollar impact, annual application, most confusion
2. LIHEAP — highest frequency need, seasonal deadlines
3. Detroit Home Repair Program — highest property impact
4. Principal Residence Exemption — most residents don't know they need to file
5. Wayne Metro Weatherization — free, long waitlist, worth getting in line early
6. DTE Low-Income Self-Sufficiency Plan — utility arrears are immediate crisis
7. Lead Safe Detroit — health urgency, families with children
8. Step Forward Michigan — foreclosure prevention, time-sensitive

---

## V3: Document Hub

Centralized repository of forms, templates, and examples referenced by the program guides.

### Contents

- **Fillable PDFs** of common application forms (hosted locally, not linking to agency sites that break)
- **Annotated examples** showing completed forms with fake data and margin notes
- **Template letters** for situations programs require written statements (income affidavits, landlord verification, hardship letters)
- **Universal document checklist** — "Before you apply for anything, gather these 5 things" (ID, proof of income, proof of address, utility bill, deed/lease)
- **"Where to get it" guide** for common missing documents (how to get a copy of your deed, how to get a replacement Social Security card, where to get free tax preparation)

### Legal Note

The site provides informational guidance about publicly available programs. It does not provide legal, tax, or financial advice. Each guide includes a standard disclaimer and contact information for Michigan Legal Aid (housing-specific intake) and Accounting Aid Society (free tax preparation) for residents who need professional guidance.

---

## V4: Outcome Tracking (Future)

Password-protected admin tool for CDC staff. Requires a backend (database, authentication). Separate from the public screener.

### What It Tracks

- Resident interactions (anonymized or with consent)
- Programs matched per resident
- Referral status: referred / application started / submitted / approved / denied
- Denial reasons (program-level patterns)
- Dollar value of approved benefits

### What It Produces

- **Funding gap reports**: "47 residents qualified for lead abatement. 12 were funded. 35 unfunded. Estimated gap: $700K." This is grant application ammunition.
- **Program effectiveness**: Which programs have the highest approval rate? Which deny most often and why?
- **Seasonal patterns**: When do utility assistance requests spike? When should outreach ramp up?
- **Impact metrics**: Total benefits secured for residents through the tool. The number that justifies the tool's existence to funders.

### Technical Shift

V4 moves from static site to application:
- Supabase or Firebase for database and auth
- Role-based access (PM can enter data, ED can view reports)
- Still deployed on Vercel, but now with API routes
- Resident-facing screener remains static and privacy-preserving

---

## Program Data: The Real Asset

The technology is commodity. Any developer can build a form that filters a JSON file. The program database is the defensible value:

- Structured eligibility criteria in machine-readable format
- Plain-language application guides tested with actual residents
- Funding status verified quarterly
- Locale-specific knowledge that currently lives in case workers' heads

This data doesn't exist in structured form anywhere. Agencies publish their own program details in their own formats. 211 databases track programs but not eligibility rules at the field level. Building and maintaining this database for one city proves the model. Replicating it across cities is where the consulting value compounds.

### Data Maintenance

Programs change. Funding runs out. Income thresholds update annually. The database requires quarterly verification:

- [ ] Check each program's funding status (open/waitlisted/exhausted)
- [ ] Update income thresholds for new calendar year (FPL tables publish in January)
- [ ] Verify application URLs and contact info still work
- [ ] Add new programs discovered through CDC partnerships
- [ ] Remove discontinued programs
- [ ] Update "last_verified" dates

This maintenance cycle is the ongoing relationship with partner CDCs. They surface program changes through their daily work. The database stays current because the people using it are the same people who notice when something changes.

---

## Development Plan

| Phase | Scope | Estimated Hours |
|-------|-------|-----------------|
| **Program research** | Catalog 30-40 Detroit programs with structured eligibility data | 20-30 |
| **Data model + matching engine** | TypeScript interfaces, rule evaluation, FPL lookup tables | 4-6 |
| **Frontend (screener)** | Intake form, results display, print layout | 8-12 |
| **Frontend (home + about)** | Landing page, city selector, about page | 3-4 |
| **Testing** | Run 15+ resident scenarios, verify matches | 4-6 |
| **Deploy** | Domain, Vercel setup, DNS | 1-2 |
| **MVP Total** | | **40-60 hours** |

| Add-on | Scope | Estimated Hours |
|--------|-------|-----------------|
| **V2: Program guides** (top 8) | Plain-language application walkthroughs | 16-24 |
| **V3: Document hub** | Forms, examples, templates | 8-12 |
| **V4: Outcome tracking** | Backend, auth, admin dashboard | 20-30 |

---

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Deployment

```bash
npm run build    # Static export
# Push to GitHub → Vercel auto-deploys
```

Configure custom domain (`neighborhoodnavigator.org`) in Vercel dashboard.

---

## License

TBD — Considering open source (MIT) for the codebase with the program data licensed separately, since the structured program database is the asset that has independent value.

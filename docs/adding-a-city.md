# Adding a New City

How to expand Neighborhood Navigator to a new locale.

## Prerequisites

1. A partner organization in the city (CDC, United Way, Community Action Agency) willing to validate program data
2. 20-30 hours of research time for the initial program database
3. An ongoing relationship for quarterly data verification

## Steps

### 1. Create City Data Directory

```
src/data/{city-slug}/
├── programs.json    # Program database
└── meta.json        # City metadata
```

### 2. Create meta.json

```json
{
  "id": "detroit",
  "name": "Detroit",
  "state": "Michigan",
  "state_abbr": "MI",
  "valid_zips": ["48201", "48202", "48203", "..."],
  "fallback_resource": {
    "name": "Michigan 211",
    "phone": "211",
    "url": "https://mi211.org"
  },
  "legal_aid": {
    "name": "Michigan Legal Aid",
    "phone": "(877) 964-4722",
    "url": "https://michiganlegalhelp.org",
    "note": "Free legal help for housing issues"
  },
  "tax_prep": {
    "name": "Accounting Aid Society",
    "phone": "(313) 556-1920",
    "url": "https://accountingaidsociety.org",
    "note": "Free tax preparation for qualifying households"
  },
  "fpl_year": 2026,
  "ami_year": 2025,
  "ami_source": "HUD FY2025 Detroit-Warren-Dearborn MSA"
}
```

The `valid_zips` array determines which ZIP codes route to this city's screener. If a resident enters a ZIP not in any city's list, they get the fallback message with statewide resources.

### 3. Research and Build programs.json

Follow `docs/data-collection-guide.md`. The program schema is in `docs/program-schema.md`.

Start with the highest-impact categories:
1. Property tax relief (if applicable in the state)
2. Utility assistance (LIHEAP is federal, so every city has a local administrator)
3. Home repair programs (municipal and state)
4. Foreclosure prevention

### 4. Add City to Home Page

Add the city to the selector on the home page. The routing is automatic: `/detroit` loads `src/data/detroit/`, `/flint` loads `src/data/flint/`.

### 5. Test With Partner Organization

Run 10-15 resident scenarios with the partner org's staff. They'll catch:
- Programs you missed
- Eligibility rules you got wrong
- Programs that closed since you researched them
- Local knowledge that doesn't appear on any website

### 6. Deploy

Push to GitHub. Vercel auto-deploys. The new city is live.

## What Varies by City

| Component | City-Specific? | Notes |
|-----------|---------------|-------|
| Program database | Yes | Every city has different programs, agencies, contacts |
| Eligibility rule types | No | The rule engine is universal |
| FPL thresholds | No | Federal, same everywhere |
| AMI thresholds | Yes | HUD publishes by MSA (metro area) |
| ZIP code validation | Yes | Each city defines its service area |
| Intake questions | No | Same questions work everywhere |
| Matching logic | No | Same engine, different data |

## What Stays the Same

The codebase, matching engine, UI, and deployment infrastructure don't change when you add a city. You're adding a JSON file, not writing code. This is the scalability model: the engineering is built once, the data is the per-city investment.

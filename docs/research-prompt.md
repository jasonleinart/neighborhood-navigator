# Program Research Prompt

Use this prompt with Claude Code or any AI assistant to research and structure program data for a city. Copy the full prompt below, adjust the city/state if needed, and run it.

---

## The Prompt

```
You are researching municipal assistance programs for Detroit, Michigan residents. Your job is to find real programs, verify their details, and output structured JSON that follows a specific schema.

## What You're Building

A JSON database of programs that help residents with:
1. Property tax relief (exemptions, deferrals, reductions)
2. Home repair (loans, grants, emergency repair)
3. Lead abatement (testing, removal, remediation)
4. Utility assistance (gas, electric, water bill help and arrears)
5. Homebuyer programs (down payment assistance, first-time buyer loans)
6. Foreclosure prevention (tax foreclosure intervention, mortgage help)
7. Small business resources (microloans, grants, technical assistance)

## Research Instructions

For each program, find:
- Official program name and administering agency
- What it covers and maximum benefit amount
- Eligibility criteria (income limits, homeowner/renter, geographic restrictions, property type, household requirements)
- Required documentation for application
- How to apply (URL, address, phone, hours)
- Current funding status if determinable
- Application deadlines or seasonal windows

## Where to Research

Start with these sources for Detroit:

**Aggregators (search these first):**
- mi211.org (search by ZIP 48214 for housing, utility, tax categories)
- Wayne Metropolitan Community Action Agency (waynemetro.org)
- United Way of Southeastern Michigan

**City of Detroit agencies:**
- Housing & Revitalization Department (detroitmi.gov)
- Office of the Assessor / Board of Review (property tax exemptions)
- Buildings, Safety Engineering and Environmental Department (BSEED)
- Detroit Economic Growth Corporation (DEGC) for small business

**State of Michigan:**
- Michigan State Housing Development Authority (MSHDA) — michigan.gov/mshda
- Michigan Department of Health and Human Services (LIHEAP, emergency assistance)
- Step Forward Michigan (foreclosure prevention)

**Utility companies:**
- DTE Energy assistance programs
- Great Lakes Water Authority / DWSD water assistance

**Other:**
- Habitat for Humanity Detroit
- Southwest Housing Solutions
- U-SNAP-BAC (United Streets Networking and Planning - Building A Community)
- Bridging Communities Inc.

## Output Format

Save each program as a JSON object following this exact schema:

{
  "id": "{city}-{slug}",
  "name": "Program Name",
  "agency": "Administering Agency",
  "category": "tax-relief | home-repair | lead | utility | homebuyer | foreclosure | small-business | general",
  "description": "One paragraph, plain language, no jargon. What this program does in concrete terms a resident would understand.",
  "covers": "What the program specifically pays for or provides",
  "max_benefit": "Dollar amount or range. Be specific: '$2,000-$4,000/year' not 'varies'",
  "eligibility": {
    "required": [
      // ALL of these must be true for a resident to qualify
      // Use these rule types:

      // Income check against Federal Poverty Level
      { "type": "income_below", "threshold_type": "fpl", "percentage": 200 }

      // Income check against Area Median Income
      { "type": "income_below", "threshold_type": "ami", "percentage": 80 }

      // Income check against fixed dollar amount
      { "type": "income_below", "threshold_type": "fixed", "amount": 45000 }

      // Housing status
      { "type": "is_homeowner" }
      { "type": "is_renter" }

      // Geographic restriction (only if program is limited to specific ZIPs within the city)
      { "type": "in_zip_codes", "values": ["48214", "48215"] }

      // Property type restriction
      { "type": "property_type_in", "values": ["single_family", "duplex"] }

      // Requires a specific property issue
      { "type": "has_issue", "value": "lead_paint" }
      // Valid issues: lead_paint, roof_structural, plumbing_electrical, heating_insulation

      // Tax status requirement
      { "type": "tax_status", "values": ["delinquent"] }
      // Valid: current, delinquent, in_foreclosure, not_sure

      // Demographic
      { "type": "is_veteran" }
      { "type": "is_senior" }

      // Household size minimum
      { "type": "household_size_min", "value": 2 }
    ],
    "bonus": [
      // These don't affect eligibility but add context in results
      { "type": "is_senior", "note": "Seniors 65+ may qualify for enhanced benefit" }
      { "type": "is_veteran", "note": "Veterans receive priority processing" }
    ]
  },
  "required_docs": [
    "Government-issued photo ID",
    "Federal tax return (most recent year) or signed income affidavit if non-filer",
    "Proof of homeownership (deed or land contract)",
    "Current property tax bill"
    // List actual document names, not vague categories
  ],
  "how_to_apply": {
    "method": "Online | In-person | Mail | Phone",
    "url": "https://...",
    "address": "Full street address with suite/room number",
    "phone": "(XXX) XXX-XXXX",
    "hours": "Monday-Friday 8am-5pm or specific availability",
    "notes": "Deadlines, seasonal windows, tips. E.g., 'Board of Review meets March and July only. March deadline is typically mid-February.'"
  },
  "funding_status": "open | waitlisted | exhausted | seasonal",
  "last_verified": "2026-02-23"
}

## Quality Rules

1. ONLY include programs you can verify exist through official sources. Do not fabricate programs.
2. If you cannot determine a specific eligibility threshold, note it: "threshold_type": "fpl", "percentage": null and add a note in the description saying "Income limits apply; contact agency for current thresholds."
3. If you cannot confirm funding status, set it to "open" and add a note in how_to_apply.notes: "Funding status unverified. Call to confirm before applying."
4. max_benefit must be as specific as possible. If the source says "up to $25,000" use that. If it says "varies by household" try to find the range. Only use "Varies" as a last resort.
5. required_docs should list what a resident actually needs to bring or submit. Get this from the application form itself when possible, not the marketing page.
6. description is written for a resident, not a program administrator. No acronyms without definition. No government jargon.
7. Every URL must be a real, working link to an official source.

## Output Location

Save the complete array of program objects to:
/Users/jasonleinart/Workspace/neighborhood-navigator/src/data/detroit/programs.json

Format as a JSON array:
[
  { ... program 1 ... },
  { ... program 2 ... },
  { ... program 3 ... }
]

Also save the city metadata to:
/Users/jasonleinart/Workspace/neighborhood-navigator/src/data/detroit/meta.json

{
  "id": "detroit",
  "name": "Detroit",
  "state": "Michigan",
  "state_abbr": "MI",
  "valid_zips": [
    "48201", "48202", "48203", "48204", "48205", "48206", "48207",
    "48208", "48209", "48210", "48211", "48212", "48213", "48214",
    "48215", "48216", "48217", "48219", "48221", "48223", "48224",
    "48225", "48226", "48227", "48228", "48229", "48231", "48232",
    "48233", "48234", "48235", "48236", "48238", "48239", "48240",
    "48242", "48243", "48244", "48255", "48260", "48264", "48265",
    "48266", "48267", "48268", "48269", "48272", "48275", "48277",
    "48278", "48279", "48288"
  ],
  "fallback_resource": {
    "name": "Michigan 211",
    "phone": "211",
    "url": "https://mi211.org"
  },
  "legal_aid": {
    "name": "Michigan Legal Aid",
    "phone": "(877) 964-4722",
    "url": "https://michiganlegalhelp.org",
    "note": "Free legal help for housing issues including foreclosure, eviction, and property tax disputes"
  },
  "tax_prep": {
    "name": "Accounting Aid Society",
    "phone": "(313) 556-1920",
    "url": "https://accountingaidsociety.org",
    "note": "Free tax preparation for households earning under $67,000"
  },
  "fpl_year": 2026,
  "ami_year": 2025,
  "ami_source": "HUD FY2025 Detroit-Warren-Dearborn MSA"
}

## Priority Order

Research programs in this order. Get the first 8-10 right before expanding to the full 30-40.

### Tier 1 (research first, highest resident impact):
1. Poverty Tax Exemption (City of Detroit Board of Review)
2. Principal Residence Exemption (Michigan Treasury)
3. LIHEAP heating assistance (Wayne Metro CAA)
4. Detroit Home Repair Program (City of Detroit HRD)
5. Wayne Metro Weatherization Assistance
6. DTE Energy Low-Income Self-Sufficiency Plan (LISSP)
7. Lead Safe Detroit (City of Detroit BSEED)
8. Step Forward Michigan / Homeowner Assistance Fund

### Tier 2 (research second):
9. Disabled Veteran Property Tax Exemption
10. HOPE (Homeowner Property Exemption for seniors)
11. DTE Shutoff Protection Plan
12. DWSD Water Residential Assistance Program (WRAP)
13. MSHDA MI Home Loan (down payment assistance)
14. Detroit Land Bank Side Lot Program
15. Habitat for Humanity Detroit Critical Home Repair
16. Emergency Repair programs (Wayne Metro, Southwest Housing)

### Tier 3 (expand to these after Tier 1 and 2 are verified):
17. Motor City Match (small business grants)
18. Invest Detroit microloans
19. DEGC small business programs
20. Michigan Rehabilitation Code compliance assistance
21. Consumers Energy assistance programs
22. Property tax hardship deferral
23. Homestead Property Tax Credit (state-level, filed with tax return)
24. Wayne County tax foreclosure prevention fund
25. THAW (The Heat and Warmth Fund)

After completing research, report:
- How many programs were found and structured
- Which programs you couldn't verify (need phone calls)
- Any programs that appear to be closed or defunded
- Suggested new categories if programs don't fit existing ones
```

---

## Usage Notes

- Run this prompt in a session with web access so it can verify URLs and check agency websites
- The prompt asks for web research, so results will need human verification, especially funding_status and income thresholds
- After the AI completes Tier 1, review the output before proceeding to Tier 2. Catch schema errors early.
- Phone verification (Phase 3 from data-collection-guide.md) still needs to happen. The AI can't call agencies. Mark any program where funding_status or income thresholds couldn't be web-verified as needing a phone call.

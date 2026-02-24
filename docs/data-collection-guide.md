# Data Collection Guide

How to research and structure program data for a new city. This is the most time-intensive part of the project. Budget 20-30 hours for a city the size of Detroit.

## Research Strategy

Work outward from the most comprehensive sources to fill gaps with direct agency contact.

### Phase 1: Aggregator Sources (4-6 hours)

Start with organizations that already catalog programs across agencies:

1. **211 Database** (mi211.org or local equivalent). Search by ZIP code for housing, utility, tax, and repair categories. 211 has the broadest coverage but eligibility details are often incomplete.

2. **Community Action Agency** for the county (Wayne Metropolitan CAA for Detroit). They administer LIHEAP, weatherization, and emergency assistance. Their intake staff know which programs exist and which ones actually have funding. Call them.

3. **Local United Way**. They fund and track programs across their service area. Their resource guides are often more current than 211.

4. **City Housing Department** website. In Detroit: Housing & Revitalization Department. Look for "homeowner resources," "rental assistance," and "neighborhood programs" pages. Download every PDF you find.

5. **State Housing Finance Agency** (MSHDA in Michigan). Statewide programs that residents apply for locally. Down payment assistance, home repair loans, foreclosure prevention.

### Phase 2: Category-Specific Deep Dives (8-12 hours)

For each program category, identify the specific programs, eligibility rules, and application processes.

**Tax Relief**
- City Assessor's office (exemptions, appeals)
- County Treasurer (payment plans, foreclosure prevention)
- State Treasury (statewide property tax credits)
- Look for: income thresholds per household size, application deadlines (Board of Review dates), required forms by number

**Home Repair**
- City housing department (municipal loan/grant programs)
- State housing agency (rehab programs)
- Community Action Agency (weatherization, emergency repair)
- Habitat for Humanity local affiliate (critical home repair)
- Look for: income limits (usually FPL or AMI based), owner-occupancy requirements, property type restrictions, maximum grant/loan amounts

**Lead Abatement**
- City health department or BSEED equivalent
- HUD Lead Hazard Control grants (administered locally)
- Look for: child age requirements (many prioritize homes with children under 6), income limits, property age requirements (pre-1978)

**Utility Assistance**
- LIHEAP (federally funded, locally administered through Community Action Agency)
- Utility company programs (DTE, Consumers Energy, local water authority)
- State-specific programs (Michigan THAW, MEAP)
- Look for: seasonal application windows, income limits, arrears thresholds, shutoff protection rules

**Homebuyer Programs**
- State housing agency (down payment assistance, first-time buyer programs)
- City-specific incentives (neighborhood-targeted DPA)
- CDFI lenders (community development financial institutions with below-market loans)
- Look for: purchase price limits, income limits, geographic restrictions, first-time buyer definitions

**Foreclosure Prevention**
- State programs (Step Forward Michigan, Homeowner Assistance Fund)
- County programs (tax foreclosure prevention funds)
- Legal aid (free legal representation in foreclosure)
- Look for: type of foreclosure (tax vs. mortgage), timeline requirements, documentation needs

**Small Business**
- City economic development office
- SBA district office
- CDFI lenders
- Look for: business type restrictions, revenue limits, use-of-funds restrictions, match requirements

### Phase 3: Verification Calls (4-6 hours)

For each program, call the administering agency to verify:

1. **Is this program currently accepting applications?** Websites lag reality by months.
2. **What are the current income limits?** Published guidelines may be from last year.
3. **What's the typical wait time?** "Open" doesn't mean "fast."
4. **What's the most common reason applications get denied?** This feeds the program guides in V2.
5. **Is there a contact person for referrals?** A direct name beats a general phone number.

Keep a log of who you spoke with and when. This becomes the `last_verified` date.

## Structuring the Data

For each program discovered:

1. Open `docs/program-schema.md` for the required fields
2. Create a JSON entry following the schema
3. Translate prose eligibility into structured rules:

| Agency says... | Rule type | Parameters |
|---------------|-----------|------------|
| "Must earn less than 200% FPL" | `income_below` | `threshold_type: "fpl", percentage: 200` |
| "Must be homeowner" | `is_homeowner` | — |
| "Detroit residents only" | `in_zip_codes` | All Detroit ZIPs |
| "Single-family homes" | `property_type_in` | `["single_family"]` |
| "Must have children under 6" | (custom note) | Add as bonus rule with note |
| "Veterans receive priority" | bonus: `is_veteran` | `note: "Veterans receive priority processing"` |

4. If eligibility criteria don't map to existing rule types, note it. We may need to add a rule type or handle it as a note on the program card.

## Common Pitfalls

**Income thresholds change annually.** FPL updates every January. AMI updates vary by HUD region. Always record the threshold type and percentage, not a hardcoded dollar amount. The matcher calculates the actual threshold from current-year tables.

**"Open" doesn't mean funded.** A program page that says "accepting applications" may have run out of money months ago. Call to confirm.

**Multiple programs, same agency.** A single agency may run 3-4 programs with different eligibility. The City of Detroit HRD runs both the Home Repair Program (0% deferred loan) and Emergency Repair (grant for urgent issues). These need separate entries.

**Program names change.** Agencies rebrand programs when funding sources change. "MSHDA Home Repair" becomes "MI Home Repair" becomes something else. Track by agency + purpose, not just name.

**Geographic restrictions within a city.** Some programs serve specific neighborhoods, wards, or census tracts. Map these to ZIP codes for the screener (approximate but functional).

## Quality Standard

A program entry is complete when:

- [ ] You could explain the program to a resident in 30 seconds using only the `description` field
- [ ] The eligibility rules would correctly match or exclude a resident you've imagined in three different scenarios
- [ ] The `required_docs` list is specific enough that a resident knows exactly what to bring
- [ ] The `how_to_apply` section tells someone who's never interacted with the agency exactly what to do first
- [ ] `funding_status` was verified within the last 30 days

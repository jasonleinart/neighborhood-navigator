# Program Data Schema

Every program in the database follows this structure. The schema is designed to support automated eligibility matching while remaining human-readable for maintenance.

## Full Schema

```typescript
interface Program {
  // Identity
  id: string;                    // Format: "{city}-{slug}" e.g. "detroit-poverty-tax-exemption"
  name: string;                  // Display name
  agency: string;                // Administering organization
  category: ProgramCategory;     // Grouping for results display

  // Description
  description: string;           // One paragraph, plain language, no jargon
  covers: string;                // What the program pays for or provides
  max_benefit: string;           // Dollar range or description ("Up to $25,000", "Varies")

  // Eligibility
  eligibility: {
    required: EligibilityRule[]; // ALL must pass for a match
    bonus: BonusRule[];          // Additional qualifiers that strengthen match or unlock extras
  };

  // Application
  required_docs: string[];       // Documents needed to apply
  how_to_apply: {
    method: string;              // "Online" | "In-person" | "Mail" | "Phone" | combination
    url?: string;                // Application URL if online
    address?: string;            // Physical location if in-person
    phone?: string;              // Phone number if phone-based
    hours?: string;              // Office hours or availability windows
    notes?: string;              // Deadlines, seasonal availability, tips
  };

  // Status
  funding_status: "open" | "waitlisted" | "exhausted" | "seasonal";
  last_verified: string;         // ISO date, e.g. "2026-02-23"
}
```

## Categories

| Category | Tag | What It Covers |
|----------|-----|----------------|
| Tax Relief | `tax-relief` | Property tax exemptions, deferrals, reductions |
| Home Repair | `home-repair` | Structural repair, rehabilitation loans and grants |
| Lead Abatement | `lead` | Lead paint testing, removal, remediation |
| Utility Assistance | `utility` | Gas, electric, water bill assistance and arrears |
| Homebuyer Programs | `homebuyer` | Down payment assistance, first-time buyer loans |
| Foreclosure Prevention | `foreclosure` | Tax foreclosure intervention, mortgage assistance |
| Small Business | `small-business` | Microloans, grants, technical assistance for local businesses |
| General Assistance | `general` | Catch-all for programs that don't fit above |

## Eligibility Rule Types

Each rule is an object with a `type` field and type-specific parameters.

### Income Rules

```json
{
  "type": "income_below",
  "threshold_type": "fpl",
  "percentage": 200
}
```

Checks household income against Federal Poverty Level percentage, adjusted for household size. The matcher uses the current year's FPL table (published annually by HHS in January).

| `threshold_type` | Meaning |
|-------------------|---------|
| `fpl` | Federal Poverty Level (most common for federal/state programs) |
| `ami` | Area Median Income (used by housing programs, HUD-published) |
| `fixed` | Fixed dollar amount (use `amount` field instead of `percentage`) |

```json
{
  "type": "income_below",
  "threshold_type": "ami",
  "percentage": 80
}
```

```json
{
  "type": "income_below",
  "threshold_type": "fixed",
  "amount": 45000
}
```

### Housing Status Rules

```json
{ "type": "is_homeowner" }
{ "type": "is_renter" }
```

Boolean. Matches against the resident's declared housing status.

### Geographic Rules

```json
{
  "type": "in_zip_codes",
  "values": ["48214", "48215", "48224"]
}
```

Some programs serve specific neighborhoods or ZIP codes within a city. If omitted, the program is assumed to cover the entire city.

### Property Rules

```json
{
  "type": "property_type_in",
  "values": ["single_family", "duplex"]
}
```

Valid property types: `single_family`, `duplex`, `multi_unit`, `condo`, `mobile_home`, `apartment`.

```json
{
  "type": "has_issue",
  "value": "lead_paint"
}
```

Valid issues: `lead_paint`, `roof_structural`, `plumbing_electrical`, `heating_insulation`.

### Tax Status Rules

```json
{
  "type": "tax_status",
  "values": ["delinquent", "in_foreclosure"]
}
```

Valid statuses: `current`, `delinquent`, `in_foreclosure`, `not_sure`. If a rule specifies `delinquent`, it also matches `not_sure` (err toward inclusion).

### Demographic Rules

```json
{ "type": "is_veteran" }
{ "type": "is_senior" }
```

Boolean. Senior is defined as 62+ (standard for most housing programs).

### Household Size Rules

```json
{
  "type": "household_size_min",
  "value": 2
}
```

Some programs target families (household size 2+) or have per-person calculations.

## Bonus Rules

Bonus rules don't affect match/no-match. They add context to the results display.

```json
{
  "type": "is_senior",
  "note": "Seniors 65+ may qualify for enhanced benefit amount"
}
```

```json
{
  "type": "has_issue",
  "value": "lead_paint",
  "note": "Households with children under 6 receive priority"
}
```

## Match Confidence

The matcher evaluates all required rules and returns:

| Confidence | Criteria |
|------------|----------|
| **Strong match** | All required rules pass definitively |
| **Likely match** | All rules pass, but income was a range bracket that straddles the eligibility threshold (e.g., resident said "$25-40K" and the program caps at $35K) |
| **No match** | Any required rule fails — program is excluded from results |

Income ranges are the primary source of "likely" vs "strong" matches. All other rule types are binary.

## Data Entry Checklist

When adding a new program:

- [ ] `id` follows `{city}-{slug}` format
- [ ] `description` is one paragraph, plain language, no acronyms without definition
- [ ] `max_benefit` is specific ("$2,000-$4,000/year") not vague ("varies")
- [ ] Every eligibility rule has a matching `type` from the list above
- [ ] `required_docs` lists actual document names, not categories
- [ ] `how_to_apply` includes at least one contact method
- [ ] `funding_status` reflects current reality (call the agency if unsure)
- [ ] `last_verified` is today's date

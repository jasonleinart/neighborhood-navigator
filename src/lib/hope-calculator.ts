import type {
  HopeInput,
  HopeResult,
  HopeData,
  HopeThresholdTable,
  ExemptionLevel,
  BoardReviewSession,
} from "./hope-types";

const EXEMPTION_LEVELS: ExemptionLevel[] = [100, 75, 50, 25, 10];

/**
 * Walk the threshold table for the given household size.
 * Returns the highest exemption percentage the resident qualifies for,
 * or null if they don't qualify for any standard level.
 */
export function calculateExemptionLevel(
  householdSize: number,
  annualIncome: number,
  thresholds: HopeThresholdTable
): ExemptionLevel | null {
  // Clamp household size to 1-8 (the table caps at 8)
  const sizeKey = String(Math.min(Math.max(householdSize, 1), 8));
  const row = thresholds[sizeKey];
  if (!row) return null;

  // Check from highest exemption (100%) down to lowest (10%)
  // The first one where income <= threshold is the best they qualify for
  for (const level of EXEMPTION_LEVELS) {
    const threshold = row[String(level)];
    if (threshold !== undefined && annualIncome <= threshold) {
      return level;
    }
  }

  return null;
}

/**
 * Check asset eligibility against the $12,000 limit.
 */
export function checkAssetEligibility(totalAssets: number, limit: number): boolean {
  return totalAssets <= limit;
}

/**
 * Estimate tax savings based on exemption percentage and Detroit average tax bill.
 */
export function estimateSavings(
  exemptionPercent: ExemptionLevel,
  averageBill: { low: number; high: number }
): { low: number; high: number } {
  const fraction = exemptionPercent / 100;
  return {
    low: Math.round(averageBill.low * fraction),
    high: Math.round(averageBill.high * fraction),
  };
}

/**
 * Build a personalized document checklist based on the resident's situation.
 */
export function getRequiredDocuments(
  input: HopeInput,
  docs: HopeData["required_documents"]
): string[] {
  const list: string[] = [...docs.always];

  if (input.files_taxes) {
    list.push(...docs.if_files_taxes);
  } else if (input.is_senior) {
    list.push(...docs.if_senior_non_filer);
  } else {
    list.push(...docs.if_non_filer);
  }

  if (input.ownership_type === "land_contract") {
    list.push(...docs.if_land_contract);
  }

  if (input.income_dropped_20pct) {
    list.push(...docs.if_income_dropped);
  }

  list.push(...docs.asset_documentation);

  return list;
}

/**
 * Find the next upcoming Board of Review session.
 * Returns null if all sessions have passed.
 */
export function getNextDeadline(
  boardDates: BoardReviewSession[],
  hopeDeadline: string,
  hopeDeadlineLabel: string
): HopeResult["next_deadline"] {
  const now = new Date();

  for (const session of boardDates) {
    // Use the last date in the session as the cutoff
    const lastDate = new Date(session.dates[session.dates.length - 1]);
    if (lastDate >= now) {
      return { session, hope_deadline: hopeDeadline, hope_deadline_label: hopeDeadlineLabel };
    }
  }

  return null;
}

/**
 * Run the full HOPE calculation.
 */
export function calculateHope(input: HopeInput, data: HopeData): HopeResult {
  const assetEligible = checkAssetEligibility(input.total_assets, data.asset_limit);

  let exemptionLevel = calculateExemptionLevel(
    input.household_size,
    input.annual_income,
    data.thresholds
  );

  // Check 10% special eligibility: foreclosure threat OR 20%+ income drop
  let special10pct = false;
  let special10pctReason: string | null = null;

  if (exemptionLevel === null && (input.facing_foreclosure || input.income_dropped_20pct)) {
    // Check if income is within the 10% threshold
    const sizeKey = String(Math.min(Math.max(input.household_size, 1), 8));
    const threshold10 = data.thresholds[sizeKey]?.["10"];
    if (threshold10 !== undefined && input.annual_income <= threshold10) {
      exemptionLevel = 10;
      special10pct = true;
      if (input.facing_foreclosure && input.income_dropped_20pct) {
        special10pctReason = "You qualify for the 10% special exemption because you are facing tax foreclosure and your income dropped 20% or more.";
      } else if (input.facing_foreclosure) {
        special10pctReason = "You qualify for the 10% special exemption because you are facing tax foreclosure.";
      } else {
        special10pctReason = "You qualify for the 10% special exemption because your household income dropped 20% or more from last year.";
      }
    }
  }

  const estimatedSavings =
    exemptionLevel && assetEligible
      ? estimateSavings(exemptionLevel, data.average_tax_bill)
      : null;

  const documentsNeeded = getRequiredDocuments(input, data.required_documents);

  const nextDeadline = getNextDeadline(
    data.board_of_review,
    data.hope_deadline,
    data.hope_deadline_label
  );

  return {
    exemption_level: assetEligible ? exemptionLevel : null,
    asset_eligible: assetEligible,
    estimated_savings: estimatedSavings,
    documents_needed: documentsNeeded,
    next_deadline: nextDeadline,
    special_10pct: special10pct,
    special_10pct_reason: special10pctReason,
  };
}

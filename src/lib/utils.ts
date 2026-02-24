import type { IncomeRange, ProgramCategory } from "./types";

// 2026 Federal Poverty Level guidelines (annual, 48 contiguous states)
// Source: HHS Poverty Guidelines
const FPL_2026_BASE = 15650; // 1-person household
const FPL_2026_INCREMENT = 5530; // per additional person

export function getFPLThreshold(
  householdSize: number,
  percentage: number
): number {
  const base = FPL_2026_BASE + FPL_2026_INCREMENT * Math.max(0, householdSize - 1);
  return Math.round(base * (percentage / 100));
}

// HUD FY2025 Area Median Income for Detroit-Warren-Dearborn MSA
// Source: HUD Income Limits
const AMI_2025_DETROIT: Record<number, number> = {
  1: 62650,
  2: 71600,
  3: 80550,
  4: 89500,
  5: 96700,
  6: 103850,
  7: 111050,
  8: 118200,
};

export function getAMIThreshold(
  householdSize: number,
  percentage: number
): number {
  const size = Math.min(Math.max(householdSize, 1), 8);
  const ami = AMI_2025_DETROIT[size];
  return Math.round(ami * (percentage / 100));
}

// Income range bracket boundaries
const INCOME_BRACKETS: Record<IncomeRange, { min: number; max: number; midpoint: number }> = {
  under_25k: { min: 0, max: 25000, midpoint: 12500 },
  "25k_40k": { min: 25000, max: 40000, midpoint: 32500 },
  "40k_60k": { min: 40000, max: 60000, midpoint: 50000 },
  "60k_80k": { min: 60000, max: 80000, midpoint: 70000 },
  over_80k: { min: 80000, max: Infinity, midpoint: 100000 },
};

export function getIncomeBracket(range: IncomeRange) {
  return INCOME_BRACKETS[range];
}

export function incomeRangeMidpoint(range: IncomeRange): number {
  return INCOME_BRACKETS[range].midpoint;
}

/**
 * Check if the income bracket straddles a threshold.
 * "Straddles" means the threshold falls within the bracket's min-max range,
 * so we can't definitively say the resident is above or below it.
 */
export function incomeRangeStraddlesThreshold(
  range: IncomeRange,
  threshold: number
): boolean {
  const bracket = INCOME_BRACKETS[range];
  return threshold > bracket.min && threshold < bracket.max;
}

/**
 * Check if the resident's income is definitively below the threshold.
 * True only if the entire bracket is below the threshold.
 */
export function incomeDefinitelyBelow(
  range: IncomeRange,
  threshold: number
): boolean {
  const bracket = INCOME_BRACKETS[range];
  return bracket.max <= threshold;
}

/**
 * Check if the resident's income is definitively above the threshold.
 * True only if the entire bracket is above the threshold.
 */
export function incomeDefinitelyAbove(
  range: IncomeRange,
  threshold: number
): boolean {
  const bracket = INCOME_BRACKETS[range];
  return bracket.min >= threshold;
}

// Category display labels
const CATEGORY_LABELS: Record<ProgramCategory, string> = {
  "tax-relief": "Property Tax Relief",
  "home-repair": "Home Repair",
  lead: "Lead Abatement",
  utility: "Utility Assistance",
  homebuyer: "Homebuyer Programs",
  foreclosure: "Foreclosure Prevention",
  "small-business": "Small Business",
  general: "Other Programs",
};

export function getCategoryLabel(category: ProgramCategory): string {
  return CATEGORY_LABELS[category];
}

// Category sort order (determines display order of groups)
const CATEGORY_ORDER: ProgramCategory[] = [
  "tax-relief",
  "utility",
  "home-repair",
  "lead",
  "foreclosure",
  "homebuyer",
  "small-business",
  "general",
];

export function getCategoryOrder(category: ProgramCategory): number {
  return CATEGORY_ORDER.indexOf(category);
}

// Income range display labels
export const INCOME_RANGE_LABELS: Record<IncomeRange, string> = {
  under_25k: "Under $25,000",
  "25k_40k": "$25,000 - $40,000",
  "40k_60k": "$40,000 - $60,000",
  "60k_80k": "$60,000 - $80,000",
  over_80k: "Over $80,000",
};

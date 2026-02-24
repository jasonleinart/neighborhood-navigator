import type {
  Program,
  EligibilityRule,
  ResidentInput,
  MatchResult,
  MatchConfidence,
} from "./types";
import {
  getFPLThreshold,
  getAMIThreshold,
  incomeDefinitelyBelow,
  incomeDefinitelyAbove,
  incomeRangeStraddlesThreshold,
  getCategoryOrder,
} from "./utils";

type RuleResult = "pass" | "likely" | "fail";

/**
 * Evaluate a single eligibility rule against the resident's input.
 * Returns "pass" (definitely qualifies), "likely" (income bracket straddles),
 * or "fail" (does not qualify).
 */
function evaluateRule(rule: EligibilityRule, input: ResidentInput): RuleResult {
  switch (rule.type) {
    case "income_below": {
      let threshold: number;
      if (rule.threshold_type === "fpl") {
        threshold = getFPLThreshold(input.household_size, rule.percentage);
      } else if (rule.threshold_type === "ami") {
        threshold = getAMIThreshold(input.household_size, rule.percentage);
      } else {
        threshold = rule.amount;
      }

      if (incomeDefinitelyBelow(input.income_range, threshold)) return "pass";
      if (incomeRangeStraddlesThreshold(input.income_range, threshold)) return "likely";
      if (incomeDefinitelyAbove(input.income_range, threshold)) return "fail";
      // Edge case: bracket max equals threshold — count as pass
      return "pass";
    }

    case "is_homeowner":
      return input.housing_status === "owner" ? "pass" : "fail";

    case "is_renter":
      return input.housing_status === "renter" ? "pass" : "fail";

    case "in_zip_codes":
      return rule.values.includes(input.zip) ? "pass" : "fail";

    case "property_type_in":
      return input.property_type && rule.values.includes(input.property_type)
        ? "pass"
        : "fail";

    case "has_issue":
      return input.issues.includes(rule.value) ? "pass" : "fail";

    case "tax_status": {
      // Per schema: if rule requires "delinquent", also match "not_sure" (err toward inclusion)
      const expandedValues = [...rule.values];
      if (expandedValues.includes("delinquent") && !expandedValues.includes("not_sure")) {
        expandedValues.push("not_sure");
      }
      if (expandedValues.includes("in_foreclosure") && !expandedValues.includes("not_sure")) {
        expandedValues.push("not_sure");
      }
      return expandedValues.includes(input.tax_status) ? "pass" : "fail";
    }

    case "is_veteran":
      return input.is_veteran ? "pass" : "fail";

    case "is_senior":
      return input.is_senior ? "pass" : "fail";

    case "household_size_min":
      return input.household_size >= rule.value ? "pass" : "fail";

    case "has_disability":
      return input.has_disability ? "pass" : "fail";

    case "has_young_children":
      return input.has_young_children ? "pass" : "fail";

    case "interested_in_buying":
      return input.interested_in_buying ? "pass" : "fail";

    case "has_utility_arrears":
      return input.utility_arrears ? "pass" : "fail";

    case "utility_provider_is":
      if (input.utility_provider === "not_sure") return "likely";
      return rule.values.includes(input.utility_provider) ? "pass" : "fail";

    default:
      // Unknown rule type — don't disqualify
      return "pass";
  }
}

/**
 * Match a resident's input against all programs.
 * Returns sorted array of matching programs with confidence levels.
 * Excludes programs with funding_status "exhausted".
 */
export function matchPrograms(
  input: ResidentInput,
  programs: Program[]
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const program of programs) {
    // Skip exhausted programs
    if (program.funding_status === "exhausted") continue;

    // Evaluate all required rules
    let overallConfidence: MatchConfidence = "strong";
    let matched = true;

    for (const rule of program.eligibility.required) {
      const result = evaluateRule(rule, input);
      if (result === "fail") {
        matched = false;
        break;
      }
      if (result === "likely") {
        overallConfidence = "likely";
      }
    }

    if (!matched) continue;

    // Programs with no required rules are informational — show as "likely"
    // unless they truly apply to everyone
    if (program.eligibility.required.length === 0) {
      overallConfidence = "likely";
    }

    // Collect bonus notes that apply
    const bonusNotes: string[] = [];
    for (const bonus of program.eligibility.bonus) {
      if (bonus.type === "is_senior" && input.is_senior && bonus.note) {
        bonusNotes.push(bonus.note);
      } else if (bonus.type === "is_veteran" && input.is_veteran && bonus.note) {
        bonusNotes.push(bonus.note);
      } else if (bonus.type === "has_disability" && input.has_disability && bonus.note) {
        bonusNotes.push(bonus.note);
      } else if (bonus.type === "has_young_children" && input.has_young_children && bonus.note) {
        bonusNotes.push(bonus.note);
      } else if (
        bonus.type === "has_issue" &&
        bonus.value &&
        input.issues.includes(bonus.value as ResidentInput["issues"][number]) &&
        bonus.note
      ) {
        bonusNotes.push(bonus.note);
      }
    }

    results.push({ program, confidence: overallConfidence, bonusNotes });
  }

  // Sort: strong before likely, then by category order
  results.sort((a, b) => {
    const confOrder = a.confidence === "strong" ? 0 : 1;
    const confOrderB = b.confidence === "strong" ? 0 : 1;
    if (confOrder !== confOrderB) return confOrder - confOrderB;
    return getCategoryOrder(a.program.category) - getCategoryOrder(b.program.category);
  });

  return results;
}

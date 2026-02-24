// Program categories
export type ProgramCategory =
  | "tax-relief"
  | "home-repair"
  | "lead"
  | "utility"
  | "homebuyer"
  | "foreclosure"
  | "small-business"
  | "general";

export type FundingStatus = "open" | "waitlisted" | "exhausted" | "seasonal";

// Eligibility rule types — discriminated union on `type`
export type EligibilityRule =
  | { type: "income_below"; threshold_type: "fpl"; percentage: number; note?: string }
  | { type: "income_below"; threshold_type: "ami"; percentage: number; note?: string }
  | { type: "income_below"; threshold_type: "fixed"; amount: number; note?: string }
  | { type: "is_homeowner" }
  | { type: "is_renter" }
  | { type: "in_zip_codes"; values: string[] }
  | { type: "property_type_in"; values: PropertyType[] }
  | { type: "has_issue"; value: PropertyIssue }
  | { type: "tax_status"; values: TaxStatus[] }
  | { type: "is_veteran" }
  | { type: "is_senior" }
  | { type: "household_size_min"; value: number }
  | { type: "has_disability" }
  | { type: "has_young_children" }
  | { type: "interested_in_buying" }
  | { type: "has_utility_arrears" }
  | { type: "utility_provider_is"; values: string[] };

export type BonusRule = {
  type: string;
  value?: string;
  note: string;
};

export type PropertyType =
  | "single_family"
  | "duplex"
  | "multi_unit"
  | "condo"
  | "mobile_home"
  | "apartment";

export type PropertyIssue =
  | "lead_paint"
  | "roof_structural"
  | "plumbing_electrical"
  | "heating_insulation";

export type TaxStatus = "current" | "delinquent" | "in_foreclosure" | "not_sure";

export type HousingStatus = "owner" | "renter" | "other";

export type UtilityProvider = "dte" | "consumers" | "other" | "not_sure";

// Full program shape (matches programs.json)
export interface Program {
  id: string;
  name: string;
  agency: string;
  category: ProgramCategory;
  description: string;
  covers: string;
  max_benefit: string;
  eligibility: {
    required: EligibilityRule[];
    bonus: BonusRule[];
  };
  required_docs: string[];
  how_to_apply: {
    method: string;
    url?: string;
    address?: string;
    phone?: string;
    hours?: string;
    notes?: string;
  };
  funding_status: FundingStatus;
  last_verified: string;
}

// City metadata shape (matches meta.json)
export interface CityMeta {
  id: string;
  name: string;
  state: string;
  state_abbr: string;
  valid_zips: string[];
  fallback_resource: { name: string; phone: string; url: string };
  legal_aid: { name: string; phone: string; url: string; note: string };
  tax_prep: { name: string; phone: string; url: string; note: string };
  fpl_year: number;
  ami_year: number;
  ami_source: string;
}

// Income brackets from the intake form
export type IncomeRange =
  | "under_25k"
  | "25k_40k"
  | "40k_60k"
  | "60k_80k"
  | "over_80k";

// Resident intake form state
export interface ResidentInput {
  zip: string;
  housing_status: HousingStatus;
  household_size: number;
  income_range: IncomeRange;
  is_veteran: boolean;
  is_senior: boolean;
  property_type: PropertyType | null;
  tax_status: TaxStatus;
  issues: PropertyIssue[];
  utility_arrears: boolean;
  has_disability: boolean;
  has_young_children: boolean;
  interested_in_buying: boolean;
  utility_provider: UtilityProvider;
}

// Match confidence
export type MatchConfidence = "strong" | "likely";

// Result of matching a program
export interface MatchResult {
  program: Program;
  confidence: MatchConfidence;
  bonusNotes: string[];
}

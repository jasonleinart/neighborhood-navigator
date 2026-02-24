// HOPE Tax Exemption types

export type ExemptionLevel = 100 | 75 | 50 | 25 | 10;

export type OwnershipType = "deed" | "land_contract";

export type BoardReviewSessionType = "march" | "july" | "december";

// Income thresholds: household size -> exemption percentage -> max income
export type HopeThresholdTable = Record<string, Record<string, number>>;

export interface BoardReviewSession {
  session: BoardReviewSessionType;
  label: string;
  dates: string[];
  description: string;
}

export interface FilingMethod {
  method: string;
  type: "online" | "in_person" | "email";
  url?: string;
  address?: string;
  phone?: string;
  hours?: string;
  email?: string;
  description: string;
}

export interface AssistancePartner {
  name: string;
  phone: string;
  url: string;
  services: string;
}

export interface HopeDocRequirements {
  always: string[];
  if_files_taxes: string[];
  if_non_filer: string[];
  if_senior_non_filer: string[];
  if_land_contract: string[];
  if_income_dropped: string[];
  asset_documentation: string[];
}

export interface HopeData {
  year: number;
  asset_limit: number;
  average_tax_bill: { low: number; high: number };
  thresholds: HopeThresholdTable;
  board_of_review: BoardReviewSession[];
  hope_deadline: string;
  hope_deadline_label: string;
  filing_methods: FilingMethod[];
  required_documents: HopeDocRequirements;
  assistance_partners: AssistancePartner[];
  info_url: string;
}

// Resident answers collected in the assistant
export interface HopeInput {
  household_size: number;
  annual_income: number;
  total_assets: number;
  ownership_type: OwnershipType;
  files_taxes: boolean;
  is_senior: boolean;
  facing_foreclosure: boolean;
  income_dropped_20pct: boolean;
}

// Calculation result
export interface HopeResult {
  exemption_level: ExemptionLevel | null;
  asset_eligible: boolean;
  estimated_savings: { low: number; high: number } | null;
  documents_needed: string[];
  next_deadline: {
    session: BoardReviewSession;
    hope_deadline: string;
    hope_deadline_label: string;
  } | null;
  special_10pct: boolean;
  special_10pct_reason: string | null;
}

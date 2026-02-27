"use client";

import { supabase } from "@/lib/supabase-client";

// Types for dashboard queries
export interface ScreeningRow {
  id: string;
  tenant_slug: string | null;
  zip: string;
  household_size: number;
  income_range: string;
  housing_status: string;
  matched_program_ids: string[];
  match_count: number;
  strong_count: number;
  likely_count: number;
  opted_into_intake: boolean;
  created_at: string;
}

export interface IntakeRow {
  id: string;
  tenant_slug: string;
  first_name: string;
  phone: string;
  email: string | null;
  contact_method: string;
  screening_inputs: Record<string, unknown>;
  matched_programs: { id: string; name: string; confidence: string }[];
  status: string;
  crm_synced: boolean;
  crm_reference: string | null;
  created_at: string;
}

export async function fetchScreenings(tenantSlug?: string) {
  let query = supabase
    .from("screenings")
    .select("*")
    .order("created_at", { ascending: false });

  if (tenantSlug) {
    query = query.eq("tenant_slug", tenantSlug);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ScreeningRow[];
}

export async function fetchIntakes(tenantSlug?: string) {
  let query = supabase
    .from("intakes")
    .select("*")
    .order("created_at", { ascending: false });

  if (tenantSlug) {
    query = query.eq("tenant_slug", tenantSlug);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as IntakeRow[];
}

// Aggregate helpers
export function groupByDate(rows: { created_at: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const date = row.created_at.split("T")[0];
    counts[date] = (counts[date] || 0) + 1;
  }
  return counts;
}

export function groupByField<T>(rows: T[], field: keyof T): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const val = String(row[field] ?? "unknown");
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}

export function programMatchFrequency(rows: ScreeningRow[]): Record<string, { total: number; strong: number; likely: number }> {
  const freq: Record<string, { total: number; strong: number; likely: number }> = {};

  for (const row of rows) {
    for (const pid of row.matched_program_ids || []) {
      if (!freq[pid]) freq[pid] = { total: 0, strong: 0, likely: 0 };
      freq[pid].total++;
    }
    // We know strong/likely counts but not per-program from screenings alone
    // This gives total match frequency per program
  }

  return freq;
}

export function zipDistribution(rows: ScreeningRow[]): Record<string, number> {
  return groupByField(rows, "zip");
}

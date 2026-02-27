import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      tenant_slug,
      zip,
      household_size,
      income_range,
      housing_status,
      matched_program_ids,
      match_count,
      strong_count,
      likely_count,
    } = req.body;

    if (!zip) {
      return res.status(400).json({ error: "zip is required" });
    }

    const { error } = await supabase.from("screenings").insert({
      tenant_slug: tenant_slug || null,
      zip,
      household_size,
      income_range,
      housing_status,
      matched_program_ids: matched_program_ids || [],
      match_count: match_count || 0,
      strong_count: strong_count || 0,
      likely_count: likely_count || 0,
    });

    if (error) {
      console.error("Screening insert error:", error);
      return res.status(500).json({ error: "Failed to record screening" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Screening event error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

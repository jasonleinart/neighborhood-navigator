import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./lib/supabase";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const { error } = await supabase.from("screenings").select("id").limit(1);
    if (error) throw error;
    return res.status(200).json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error("Keep-alive failed:", err);
    return res.status(500).json({ error: "Supabase unreachable" });
  }
}

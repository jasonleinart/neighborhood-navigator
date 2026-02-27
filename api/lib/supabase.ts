import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn("Supabase env vars missing — API routes will fail at runtime");
}

export const supabase = createClient(url || "", key || "", {
  auth: { persistSession: false },
});

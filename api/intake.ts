import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "./lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      tenant_slug,
      first_name,
      phone,
      email,
      contact_method,
      screening_inputs,
      matched_programs,
    } = req.body;

    if (!tenant_slug || !first_name || !phone) {
      return res.status(400).json({ error: "tenant_slug, first_name, and phone are required" });
    }

    // Insert intake record
    const { data, error } = await supabase
      .from("intakes")
      .insert({
        tenant_slug,
        first_name,
        phone,
        email: email || null,
        contact_method: contact_method || "phone",
        screening_inputs: screening_inputs || {},
        matched_programs: matched_programs || [],
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Intake insert error:", error);
      return res.status(500).json({ error: "Failed to submit intake" });
    }

    // Mark the most recent screening as opted-in (best effort)
    if (screening_inputs?.zip) {
      await supabase
        .from("screenings")
        .update({ opted_into_intake: true })
        .eq("tenant_slug", tenant_slug)
        .eq("zip", screening_inputs.zip)
        .order("created_at", { ascending: false })
        .limit(1);
    }

    // Send email notification if Resend is configured
    const resendKey = process.env.RESEND_API_KEY;
    const managerEmail = req.body.manager_email;

    if (resendKey && managerEmail) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Neighborhood Navigator <notifications@neighborhoodnavigator.org>",
            to: managerEmail,
            subject: `New intake: ${first_name}`,
            text: [
              `New resident intake from Neighborhood Navigator`,
              ``,
              `Name: ${first_name}`,
              `Phone: ${phone}`,
              email ? `Email: ${email}` : null,
              `Preferred contact: ${contact_method}`,
              ``,
              `Matched programs: ${(matched_programs || []).map((p: { name: string }) => p.name).join(", ")}`,
              ``,
              `Intake ID: ${data.id}`,
            ]
              .filter(Boolean)
              .join("\n"),
          }),
        });
      } catch (emailErr) {
        // Don't fail the intake if email fails
        console.error("Email notification failed:", emailErr);
      }
    }

    // Fire webhook if configured (platform-agnostic — works with Zapier, Make, n8n, etc.)
    const webhookUrl = req.body.webhook_url;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "intake.created",
            intake_id: data.id,
            tenant_slug,
            first_name,
            phone,
            email: email || null,
            contact_method: contact_method || "phone",
            matched_programs: matched_programs || [],
            screening_inputs: screening_inputs || {},
            created_at: new Date().toISOString(),
          }),
        });
      } catch (webhookErr) {
        console.error("Webhook failed:", webhookErr);
      }
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error("Intake error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

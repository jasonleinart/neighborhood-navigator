// Zoho CRM integration — OAuth2 token management + Lead creation

interface ZohoTokens {
  access_token: string;
  expires_at: number;
}

let cached: ZohoTokens | null = null;

async function getAccessToken(): Promise<string> {
  if (cached && cached.expires_at > Date.now() + 60_000) {
    return cached.access_token;
  }

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Zoho credentials not configured");
  }

  const res = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Zoho token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  cached = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return cached.access_token;
}

interface IntakeRecord {
  first_name: string;
  phone: string;
  email?: string | null;
  matched_programs: { id: string; name: string; confidence: string }[];
  screening_inputs: Record<string, unknown>;
}

export async function createZohoLead(intake: IntakeRecord): Promise<string | null> {
  try {
    const token = await getAccessToken();

    const programNames = intake.matched_programs.map((p) => p.name).join(", ");

    const res = await fetch("https://www.zohoapis.com/crm/v5/Leads", {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [
          {
            First_Name: intake.first_name,
            Phone: intake.phone,
            Email: intake.email || undefined,
            Lead_Source: "Neighborhood Navigator",
            Description: `Matched programs: ${programNames}\n\nScreening data: ${JSON.stringify(intake.screening_inputs, null, 2)}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Zoho create lead failed:", res.status, await res.text());
      return null;
    }

    const result = await res.json();
    return result?.data?.[0]?.details?.id || null;
  } catch (err) {
    console.error("Zoho integration error:", err);
    return null;
  }
}

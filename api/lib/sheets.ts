// Google Sheets fallback — appends intake rows via service account

interface IntakeRow {
  tenant_slug: string;
  first_name: string;
  phone: string;
  email: string | null;
  contact_method: string;
  matched_programs: string;
  zip: string;
  created_at: string;
}

export async function appendToSheet(
  spreadsheetId: string,
  row: IntakeRow
): Promise<boolean> {
  // Google Sheets API using service account
  // Requires GOOGLE_SERVICE_ACCOUNT_KEY env var (JSON string)
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    console.warn("Google service account key not configured");
    return false;
  }

  try {
    const key = JSON.parse(keyJson);
    const token = await getGoogleAccessToken(key);

    const values = [
      [
        row.created_at,
        row.tenant_slug,
        row.first_name,
        row.phone,
        row.email || "",
        row.contact_method,
        row.matched_programs,
        row.zip,
      ],
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:H:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      }
    );

    if (!res.ok) {
      console.error("Sheets append failed:", res.status, await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error("Sheets integration error:", err);
    return false;
  }
}

// Minimal JWT-based Google auth (no external deps)
async function getGoogleAccessToken(key: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = btoa(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  // Sign JWT with private key using Web Crypto
  const encoder = new TextEncoder();
  const pemContents = key.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(`${header}.${claim}`)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${header}.${claim}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  return data.access_token;
}

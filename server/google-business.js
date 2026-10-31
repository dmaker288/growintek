import { IntegrationError } from "./integrations.js";
let cached;
export async function businessProfileReport() {
  if (
    !process.env.GOOGLE_BUSINESS_CLIENT_ID ||
    !process.env.GOOGLE_BUSINESS_CLIENT_SECRET ||
    !process.env.GOOGLE_BUSINESS_REFRESH_TOKEN
  )
    throw new IntegrationError(
      "Google Business Profile needs an approved project and an owner-authorized OAuth connection. An API key alone cannot read managed locations.",
    );
  if (!cached || cached.expires < Date.now()) {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID,
        client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_BUSINESS_REFRESH_TOKEN,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    if (!r.ok || !d.access_token)
      throw new IntegrationError(
        "Business Profile authorization needs to be renewed.",
        502,
      );
    cached = {
      token: d.access_token,
      expires: Date.now() + Math.max(0, d.expires_in - 60) * 1000,
    };
  }
  const r = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    {
      headers: { Authorization: `Bearer ${cached.token}` },
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!r.ok)
    throw new IntegrationError(
      `Business Profile returned HTTP ${r.status}. Check project approval, quota and account permissions.`,
      502,
    );
  const d = await r.json();
  return {
    accounts: (d.accounts || []).map((a) => ({
      name: a.name,
      accountName: a.accountName,
      type: a.type,
    })),
    checkedAt: new Date().toISOString(),
  };
}

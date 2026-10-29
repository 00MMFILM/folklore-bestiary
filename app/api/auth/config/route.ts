export const dynamic = "force-dynamic";

/** Public capability flags only. Never return provider keys or administrator settings. */
export async function GET() {
  const unavailable = { google: false, email: false, scenario: false };
  const headers = { "Cache-Control": "no-store" };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Response.json(unavailable, { headers });

  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return Response.json(unavailable, { headers });
    const settings = await response.json();
    return Response.json({
      google: settings.external?.google === true,
      // Supabase's built-in mailer cannot deliver to the general public. Only
      // enable this after custom SMTP and the OTP templates have been verified.
      email: settings.external?.email === true && process.env.AUTH_EMAIL_ENABLED === "true",
      scenario: process.env.SCENARIO_AI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY),
    }, { headers });
  } catch {
    return Response.json(unavailable, { headers });
  }
}

"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getBrowserAuthClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: {
        flowType: "pkce",
        storageKey: "mythoria-auth",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}

export async function getScenarioAccessToken(): Promise<string | null> {
  const client = getBrowserAuthClient();
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  return error ? null : data.session?.access_token || null;
}

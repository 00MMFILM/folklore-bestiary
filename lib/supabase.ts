import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

// Public client (anon key) — lazy
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(getUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
  }
  return _supabase;
}

// Admin client for server-side API routes (bypasses RLS) — lazy
export function getAdminClient() {
  if (!_admin) {
    _admin = createClient(getUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  }
  return _admin;
}

import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Vercel Cron이 주기적으로 호출 → Supabase Free 플랜 자동 pause 방지
export async function GET() {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, posts: count, ts: new Date().toISOString() });
}

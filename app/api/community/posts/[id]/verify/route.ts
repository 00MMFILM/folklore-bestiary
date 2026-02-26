import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { verifyPassword } from "@/lib/hash";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { password } = body;

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data: post } = await supabase
    .from("community_posts")
    .select("password_hash")
    .eq("id", id)
    .single();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const valid = await verifyPassword(password, post.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 403 });
  }

  return NextResponse.json({ verified: true });
}

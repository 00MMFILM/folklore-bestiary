import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { verifyPassword } from "@/lib/hash";
import type { Genre, UpdatePostRequest } from "@/lib/community-types";

const VALID_GENRES: Genre[] = ["free", "story", "scenario", "character", "worldbuilding"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("community_posts")
    .select("id, locale, nickname, title, content, genre, creature_ids, view_count, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Manual view count increment fallback
  await supabase
    .from("community_posts")
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq("id", id);

  return NextResponse.json({ ...data, view_count: (data.view_count || 0) + 1 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body: UpdatePostRequest = await request.json();
  const { password, title, content, genre, creature_ids } = body;

  if (!password || !/^\d{4}$/.test(password)) {
    return NextResponse.json({ error: "Password must be exactly 4 digits" }, { status: 400 });
  }
  if (!title?.trim() || title.trim().length > 100) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }
  if (!content?.trim() || content.trim().length > 10000) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }
  if (!VALID_GENRES.includes(genre)) {
    return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
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

  const { error } = await supabase
    .from("community_posts")
    .update({
      title: title.trim(),
      content: content.trim(),
      genre,
      creature_ids: creature_ids || [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
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

  const { error } = await supabase.from("community_posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

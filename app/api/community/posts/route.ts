import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { hashPassword } from "@/lib/hash";
import type { CreatePostRequest, Genre } from "@/lib/community-types";
import { POSTS_PER_PAGE } from "@/lib/community-types";

const VALID_GENRES: Genre[] = ["free", "story", "scenario", "character", "worldbuilding"];

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const locale = sp.get("locale") || "ko";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const genre = sp.get("genre") as Genre | null;
  const creature = sp.get("creature");

  const supabase = getAdminClient();
  let query = supabase
    .from("community_posts")
    .select("id, locale, nickname, title, genre, creature_ids, view_count, created_at", {
      count: "exact",
    })
    .eq("locale", locale)
    .order("created_at", { ascending: false });

  if (genre && VALID_GENRES.includes(genre)) {
    query = query.eq("genre", genre);
  }
  if (creature) {
    query = query.contains("creature_ids", [creature]);
  }

  const from = (page - 1) * POSTS_PER_PAGE;
  query = query.range(from, from + POSTS_PER_PAGE - 1);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    posts: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / POSTS_PER_PAGE),
  });
}

export async function POST(request: NextRequest) {
  const body: CreatePostRequest = await request.json();
  const { locale, nickname, password, title, content, genre, creature_ids } = body;

  // Validation
  if (!nickname?.trim() || nickname.trim().length > 20) {
    return NextResponse.json({ error: "Invalid nickname" }, { status: 400 });
  }
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

  const password_hash = await hashPassword(password);

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      locale: locale || "ko",
      nickname: nickname.trim(),
      password_hash,
      title: title.trim(),
      content: content.trim(),
      genre,
      creature_ids: creature_ids || [],
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

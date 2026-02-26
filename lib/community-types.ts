export type Genre = "free" | "story" | "scenario" | "character" | "worldbuilding";

export interface CommunityPost {
  id: string;
  locale: string;
  nickname: string;
  password_hash: string;
  title: string;
  content: string;
  genre: Genre;
  creature_ids: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

export type PostListItem = Omit<CommunityPost, "password_hash" | "content" | "updated_at">;
export type PostDetail = Omit<CommunityPost, "password_hash">;

export interface CreatePostRequest {
  locale: string;
  nickname: string;
  password: string;
  title: string;
  content: string;
  genre: Genre;
  creature_ids: string[];
}

export interface UpdatePostRequest {
  password: string;
  title: string;
  content: string;
  genre: Genre;
  creature_ids: string[];
}

export const GENRES: { id: Genre; ko: string; en: string; icon: string }[] = [
  { id: "free", ko: "자유", en: "Free", icon: "💬" },
  { id: "story", ko: "소설/단편", en: "Story", icon: "📖" },
  { id: "scenario", ko: "시나리오", en: "Scenario", icon: "🎬" },
  { id: "character", ko: "캐릭터 설정", en: "Character", icon: "🧙" },
  { id: "worldbuilding", ko: "세계관 구축", en: "Worldbuilding", icon: "🌍" },
];

export const POSTS_PER_PAGE = 20;

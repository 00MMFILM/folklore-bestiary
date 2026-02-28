// ─── Lightweight i18n (no external library) ───

export type Locale = "ko" | "en" | "zh" | "ja";
export const LOCALES: Locale[] = ["ko", "en", "zh", "ja"];
export const DEFAULT_LOCALE: Locale = "ko";

export function isValidLocale(v: string): v is Locale {
  return LOCALES.includes(v as Locale);
}

// ─── Dictionary type ───

interface Dictionary {
  // Navigation
  "nav.backToMap": string;
  "nav.viewOnMap": string;
  "nav.home": string;
  "nav.exploreMap": string;
  // Creature detail
  "creature.description": string;
  "creature.abilities": string;
  "creature.weaknesses": string;
  "creature.sources": string;
  "creature.genres": string;
  "creature.storyHooks": string;
  "creature.fear": string;
  "creature.notFound": string;
  "creature.notFoundDesc": string;
  // Content types
  "ct.myth": string;
  "ct.legend": string;
  "ct.folktale": string;
  // Region/Country list
  "list.creaturesInRegion": string;
  "list.creaturesInCountry": string;
  "list.creatureCount": string;
  "list.allRegions": string;
  "list.allCountries": string;
  "list.region": string;
  "list.country": string;
  "list.fearLevel": string;
  "list.type": string;
  // Index page
  "index.title": string;
  "index.desc": string;
  "index.viewAll": string;
  "index.breadcrumb": string;
  // Meta
  "meta.siteName": string;
  "meta.siteDesc": string;
  // Community
  "community.title": string;
  "community.desc": string;
  "community.write": string;
  "community.nickname": string;
  "community.password": string;
  "community.passwordPlaceholder": string;
  "community.titleField": string;
  "community.content": string;
  "community.genre": string;
  "community.creatures": string;
  "community.submit": string;
  "community.edit": string;
  "community.delete": string;
  "community.cancel": string;
  "community.save": string;
  "community.confirmDelete": string;
  "community.passwordRequired": string;
  "community.wrongPassword": string;
  "community.noPosts": string;
  "community.firstPost": string;
  "community.views": string;
  "community.searchCreature": string;
  "community.back": string;
  "community.createdAt": string;
  "community.enterPassword": string;
  "community.passwordHint": string;
  "community.prev": string;
  "community.next": string;
  "community.page": string;
  "community.allGenres": string;
  "community.nicknamePlaceholder": string;
  "community.titlePlaceholder": string;
  "community.contentPlaceholder": string;
  "community.writeSuccess": string;
  "community.editSuccess": string;
  "community.deleteSuccess": string;
  "genre.free": string;
  "genre.story": string;
  "genre.scenario": string;
  "genre.character": string;
  "genre.worldbuilding": string;
}

const ko: Dictionary = {
  "nav.backToMap": "← 월드맵으로 돌아가기",
  "nav.viewOnMap": "맵에서 보기",
  "nav.home": "홈",
  "nav.exploreMap": "🗺️ 월드맵에서 탐험하기",
  "creature.description": "설명",
  "creature.abilities": "능력",
  "creature.weaknesses": "약점",
  "creature.sources": "출처",
  "creature.genres": "장르",
  "creature.storyHooks": "스토리 훅",
  "creature.fear": "공포",
  "creature.notFound": "이 크리처를 찾을 수 없습니다",
  "creature.notFoundDesc": "The creature you are looking for does not exist in our bestiary.",
  "ct.myth": "신화 (Myth)",
  "ct.legend": "전설 (Legend)",
  "ct.folktale": "민담 (Folktale)",
  "list.creaturesInRegion": "의 전설 속 존재들",
  "list.creaturesInCountry": "의 전설 속 존재들",
  "list.creatureCount": "종",
  "list.allRegions": "모든 대륙",
  "list.allCountries": "모든 국가",
  "list.region": "대륙",
  "list.country": "국가",
  "list.fearLevel": "공포",
  "list.type": "유형",
  "index.title": "세계 전설 속 존재 도감",
  "index.desc": "19개 대륙, 151개국의 전설 속 존재들을 탐험하세요",
  "index.viewAll": "전체 보기 →",
  "index.breadcrumb": "크리처 도감",
  "meta.siteName": "세계 요괴 도감",
  "meta.siteDesc": "150개국 707종 전설 속 존재들의 인터랙티브 월드맵",
  "community.title": "☕ 창작 카페",
  "community.desc": "크리처 기반 창작물을 공유하세요",
  "community.write": "글쓰기",
  "community.nickname": "닉네임",
  "community.password": "비밀번호",
  "community.passwordPlaceholder": "4자리 숫자",
  "community.titleField": "제목",
  "community.content": "내용",
  "community.genre": "장르",
  "community.creatures": "관련 크리처",
  "community.submit": "등록",
  "community.edit": "수정",
  "community.delete": "삭제",
  "community.cancel": "취소",
  "community.save": "저장",
  "community.confirmDelete": "정말 삭제하시겠습니까?",
  "community.passwordRequired": "비밀번호를 입력하세요",
  "community.wrongPassword": "비밀번호가 틀립니다",
  "community.noPosts": "아직 게시글이 없습니다",
  "community.firstPost": "첫 번째 글을 작성해보세요!",
  "community.views": "조회",
  "community.searchCreature": "크리처 검색...",
  "community.back": "← 목록으로",
  "community.createdAt": "작성일",
  "community.enterPassword": "비밀번호 확인",
  "community.passwordHint": "글 작성 시 입력한 비밀번호",
  "community.prev": "이전",
  "community.next": "다음",
  "community.page": "페이지",
  "community.allGenres": "전체",
  "community.nicknamePlaceholder": "닉네임 입력",
  "community.titlePlaceholder": "제목을 입력하세요",
  "community.contentPlaceholder": "내용을 입력하세요",
  "community.writeSuccess": "글이 등록되었습니다",
  "community.editSuccess": "글이 수정되었습니다",
  "community.deleteSuccess": "글이 삭제되었습니다",
  "genre.free": "💬 자유",
  "genre.story": "📖 소설/단편",
  "genre.scenario": "🎬 시나리오",
  "genre.character": "🧙 캐릭터 설정",
  "genre.worldbuilding": "🌍 세계관 구축",
};

const en: Dictionary = {
  "nav.backToMap": "← Back to World Map",
  "nav.viewOnMap": "View on Map",
  "nav.home": "Home",
  "nav.exploreMap": "🗺️ Explore on World Map",
  "creature.description": "Description",
  "creature.abilities": "Abilities",
  "creature.weaknesses": "Weaknesses",
  "creature.sources": "Sources",
  "creature.genres": "Genres",
  "creature.storyHooks": "Story Hooks",
  "creature.fear": "Fear",
  "creature.notFound": "Creature Not Found",
  "creature.notFoundDesc": "The creature you are looking for does not exist in our bestiary.",
  "ct.myth": "Myth",
  "ct.legend": "Legend",
  "ct.folktale": "Folktale",
  "list.creaturesInRegion": " Creatures",
  "list.creaturesInCountry": " Creatures",
  "list.creatureCount": " creatures",
  "list.allRegions": "All Regions",
  "list.allCountries": "All Countries",
  "list.region": "Region",
  "list.country": "Country",
  "list.fearLevel": "Fear",
  "list.type": "Type",
  "index.title": "Global Folklore Bestiary",
  "index.desc": "Explore legendary creatures from 19 regions and 151 countries",
  "index.viewAll": "View all →",
  "index.breadcrumb": "Creature Index",
  "meta.siteName": "Global Folklore Bestiary",
  "meta.siteDesc": "Interactive world map of 707 legendary creatures from 150 countries",
  "community.title": "☕ Creative Cafe",
  "community.desc": "Share creature-based creative works",
  "community.write": "Write",
  "community.nickname": "Nickname",
  "community.password": "Password",
  "community.passwordPlaceholder": "4-digit PIN",
  "community.titleField": "Title",
  "community.content": "Content",
  "community.genre": "Genre",
  "community.creatures": "Related Creatures",
  "community.submit": "Submit",
  "community.edit": "Edit",
  "community.delete": "Delete",
  "community.cancel": "Cancel",
  "community.save": "Save",
  "community.confirmDelete": "Are you sure you want to delete this post?",
  "community.passwordRequired": "Please enter your password",
  "community.wrongPassword": "Incorrect password",
  "community.noPosts": "No posts yet",
  "community.firstPost": "Be the first to write!",
  "community.views": "views",
  "community.searchCreature": "Search creatures...",
  "community.back": "← Back to list",
  "community.createdAt": "Created",
  "community.enterPassword": "Verify Password",
  "community.passwordHint": "Password you used when writing",
  "community.prev": "Previous",
  "community.next": "Next",
  "community.page": "Page",
  "community.allGenres": "All",
  "community.nicknamePlaceholder": "Enter nickname",
  "community.titlePlaceholder": "Enter title",
  "community.contentPlaceholder": "Enter content",
  "community.writeSuccess": "Post created successfully",
  "community.editSuccess": "Post updated successfully",
  "community.deleteSuccess": "Post deleted successfully",
  "genre.free": "💬 Free",
  "genre.story": "📖 Story",
  "genre.scenario": "🎬 Scenario",
  "genre.character": "🧙 Character",
  "genre.worldbuilding": "🌍 Worldbuilding",
};

const zh: Dictionary = {
  "nav.backToMap": "← 返回世界地图",
  "nav.viewOnMap": "在地图上查看",
  "nav.home": "首页",
  "nav.exploreMap": "🗺️ 在世界地图上探索",
  "creature.description": "描述",
  "creature.abilities": "能力",
  "creature.weaknesses": "弱点",
  "creature.sources": "来源",
  "creature.genres": "类型",
  "creature.storyHooks": "故事线索",
  "creature.fear": "恐惧",
  "creature.notFound": "未找到该生物",
  "creature.notFoundDesc": "您查找的生物不存在于我们的图鉴中。",
  "ct.myth": "神话",
  "ct.legend": "传说",
  "ct.folktale": "民间故事",
  "list.creaturesInRegion": "的传说生物",
  "list.creaturesInCountry": "的传说生物",
  "list.creatureCount": "种",
  "list.allRegions": "所有大洲",
  "list.allCountries": "所有国家",
  "list.region": "大洲",
  "list.country": "国家",
  "list.fearLevel": "恐惧",
  "list.type": "类型",
  "index.title": "世界传说生物图鉴",
  "index.desc": "探索19个大洲、151个国家的传说生物",
  "index.viewAll": "查看全部 →",
  "index.breadcrumb": "生物图鉴",
  "meta.siteName": "世界妖怪图鉴",
  "meta.siteDesc": "150个国家707种传说生物的互动世界地图",
  "community.title": "☕ 创作咖啡馆",
  "community.desc": "分享基于生物的创作作品",
  "community.write": "发帖",
  "community.nickname": "昵称",
  "community.password": "密码",
  "community.passwordPlaceholder": "4位数字",
  "community.titleField": "标题",
  "community.content": "内容",
  "community.genre": "类型",
  "community.creatures": "相关生物",
  "community.submit": "提交",
  "community.edit": "编辑",
  "community.delete": "删除",
  "community.cancel": "取消",
  "community.save": "保存",
  "community.confirmDelete": "确定要删除这篇帖子吗？",
  "community.passwordRequired": "请输入密码",
  "community.wrongPassword": "密码错误",
  "community.noPosts": "暂无帖子",
  "community.firstPost": "来写第一篇吧！",
  "community.views": "浏览",
  "community.searchCreature": "搜索生物...",
  "community.back": "← 返回列表",
  "community.createdAt": "发布日期",
  "community.enterPassword": "验证密码",
  "community.passwordHint": "发帖时设置的密码",
  "community.prev": "上一页",
  "community.next": "下一页",
  "community.page": "页",
  "community.allGenres": "全部",
  "community.nicknamePlaceholder": "输入昵称",
  "community.titlePlaceholder": "请输入标题",
  "community.contentPlaceholder": "请输入内容",
  "community.writeSuccess": "帖子发布成功",
  "community.editSuccess": "帖子修改成功",
  "community.deleteSuccess": "帖子删除成功",
  "genre.free": "💬 自由",
  "genre.story": "📖 小说/短篇",
  "genre.scenario": "🎬 剧本",
  "genre.character": "🧙 角色设定",
  "genre.worldbuilding": "🌍 世界观构建",
};

const ja: Dictionary = {
  "nav.backToMap": "← ワールドマップに戻る",
  "nav.viewOnMap": "マップで見る",
  "nav.home": "ホーム",
  "nav.exploreMap": "🗺️ ワールドマップで探検",
  "creature.description": "説明",
  "creature.abilities": "能力",
  "creature.weaknesses": "弱点",
  "creature.sources": "出典",
  "creature.genres": "ジャンル",
  "creature.storyHooks": "ストーリーフック",
  "creature.fear": "恐怖",
  "creature.notFound": "クリーチャーが見つかりません",
  "creature.notFoundDesc": "お探しのクリーチャーは図鑑に存在しません。",
  "ct.myth": "神話",
  "ct.legend": "伝説",
  "ct.folktale": "民話",
  "list.creaturesInRegion": "の伝説の存在",
  "list.creaturesInCountry": "の伝説の存在",
  "list.creatureCount": "種",
  "list.allRegions": "全大陸",
  "list.allCountries": "全国家",
  "list.region": "大陸",
  "list.country": "国",
  "list.fearLevel": "恐怖",
  "list.type": "タイプ",
  "index.title": "世界伝説の存在図鑑",
  "index.desc": "19大陸、151カ国の伝説の存在を探検しよう",
  "index.viewAll": "すべて見る →",
  "index.breadcrumb": "クリーチャー図鑑",
  "meta.siteName": "世界妖怪図鑑",
  "meta.siteDesc": "150カ国707種の伝説の存在のインタラクティブワールドマップ",
  "community.title": "☕ 創作カフェ",
  "community.desc": "クリーチャーを題材にした創作を共有しよう",
  "community.write": "投稿",
  "community.nickname": "ニックネーム",
  "community.password": "パスワード",
  "community.passwordPlaceholder": "4桁の数字",
  "community.titleField": "タイトル",
  "community.content": "内容",
  "community.genre": "ジャンル",
  "community.creatures": "関連クリーチャー",
  "community.submit": "送信",
  "community.edit": "編集",
  "community.delete": "削除",
  "community.cancel": "キャンセル",
  "community.save": "保存",
  "community.confirmDelete": "この投稿を削除しますか？",
  "community.passwordRequired": "パスワードを入力してください",
  "community.wrongPassword": "パスワードが間違っています",
  "community.noPosts": "まだ投稿がありません",
  "community.firstPost": "最初の投稿を書いてみましょう！",
  "community.views": "閲覧",
  "community.searchCreature": "クリーチャーを検索...",
  "community.back": "← 一覧に戻る",
  "community.createdAt": "作成日",
  "community.enterPassword": "パスワード確認",
  "community.passwordHint": "投稿時に設定したパスワード",
  "community.prev": "前へ",
  "community.next": "次へ",
  "community.page": "ページ",
  "community.allGenres": "すべて",
  "community.nicknamePlaceholder": "ニックネームを入力",
  "community.titlePlaceholder": "タイトルを入力してください",
  "community.contentPlaceholder": "内容を入力してください",
  "community.writeSuccess": "投稿が作成されました",
  "community.editSuccess": "投稿が修正されました",
  "community.deleteSuccess": "投稿が削除されました",
  "genre.free": "💬 自由",
  "genre.story": "📖 小説/短編",
  "genre.scenario": "🎬 シナリオ",
  "genre.character": "🧙 キャラクター設定",
  "genre.worldbuilding": "🌍 世界観構築",
};

const dictionaries: Record<Locale, Dictionary> = { ko, en, zh, ja };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.ko;
}

export function getCtLabel(locale: Locale, ct: string): string {
  const d = getDictionary(locale);
  const key = `ct.${ct}` as keyof Dictionary;
  return d[key] || ct;
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import WriterStudio from "@/components/writer/WriterStudio";
import FundingReference from "@/components/writer/FundingReference";
import { isValidLocale } from "@/lib/i18n";
import type { WriterSourceCatalog } from "@/lib/writer-project";
import sourceCatalog from "@/content/writer/sources.json";

const catalog: WriterSourceCatalog = sourceCatalog;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://folklore-bestiary.vercel.app").replace(/\/$/, "");
export function generateStaticParams() { return [{ locale: "ko" }]; }
export const metadata: Metadata = {
  title: "설화 작업실 — 출처에서 시나리오 기획까지",
  description: "출처 있는 한국 설화에서 시작해 주인공의 선택과 대가, 다섯 시퀀스, 기획 의도와 권리 기록을 작성하는 작가용 작업실. 브라우저 자동 저장과 Markdown·JSON 내보내기를 제공합니다.",
  alternates: { canonical: `${SITE_URL}/ko/studio` },
  openGraph: { title: "설화 작업실 — 출처에서 시나리오 기획까지", description: "전승의 출처를 남기고, 창작의 선택을 기록합니다.", url: `${SITE_URL}/ko/studio`, type: "website", locale: "ko_KR" },
};
export default async function StudioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  if (locale !== "ko") redirect("/ko/studio");
  return <WriterStudio catalog={catalog}><FundingReference /></WriterStudio>;
}

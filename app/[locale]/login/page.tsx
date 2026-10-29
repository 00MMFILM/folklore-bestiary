import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { isValidLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Sign in to Mythoria",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <LoginForm locale={locale} />;
}

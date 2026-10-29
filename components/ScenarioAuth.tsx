"use client";

import { useCallback, useEffect, useRef, useState, type MouseEventHandler } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserAuthClient, getScenarioAccessToken } from "@/lib/supabase-browser";

type AuthConfig = { google: boolean; email: boolean; scenario: boolean };
type Quota = { enabled: boolean; remaining: number; limit: number; resetAt: string };
const DISABLED: AuthConfig = { google: false, email: false, scenario: false };

export function scenarioErrorMessage(code: string, locale: string): string {
  const messages: Record<string, [string, string]> = {
    AUTH_REQUIRED: ["AI 생성을 사용하려면 로그인해 주세요.", "Sign in to use AI generation."],
    EMAIL_UNVERIFIED: ["이메일 인증을 완료한 뒤 다시 로그인해 주세요.", "Verify your email, then sign in again."],
    USER_LIMIT: ["오늘의 AI 생성 한도를 모두 사용했습니다. 무료 템플릿은 계속 사용할 수 있습니다.", "You have used today's AI allowance. Free templates remain available."],
    GLOBAL_LIMIT: ["사이트의 AI 생성 한도에 도달했습니다. 표시된 갱신 시각까지 무료 템플릿을 이용해 주세요.", "The site's AI allowance has been reached. Use free templates until the displayed reset time."],
    RATE_LIMIT: ["AI 생성 요청 사이에는 1분 간격이 필요합니다. 잠시 후 다시 시도해 주세요.", "Please leave one minute between AI generation requests, then try again."],
    AI_UNAVAILABLE: ["AI 생성을 준비 중입니다. 무료 템플릿과 설화 작업실은 바로 사용할 수 있습니다.", "AI generation is not available yet. Free templates and the writer studio are ready to use."],
    INVALID_INPUT: ["입력 내용이 너무 길거나 형식이 맞지 않습니다. 내용을 줄인 뒤 다시 시도해 주세요.", "Some inputs are too long or invalid. Shorten them and try again."],
    REQUEST_TOO_LARGE: ["입력 내용이 너무 깁니다. 내용을 줄인 뒤 다시 시도해 주세요.", "Your input is too long. Shorten it and try again."],
    GENERATION_FAILED: ["AI 시나리오를 완성하지 못했습니다. 이전 결과는 유지됩니다. 다시 시도해 주세요.", "The AI scenario could not be completed. Your previous result has been kept. Please try again."],
  };
  return (messages[code] || messages.GENERATION_FAILED)[locale === "ko" ? 0 : 1];
}

export function useScenarioAuth() {
  const [config, setConfig] = useState<AuthConfig>(DISABLED);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [errorCode, setErrorCode] = useState("");
  const quotaRequest = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void fetch("/api/auth/config", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Configuration unavailable");
        const data = await response.json();
        if (mounted.current) setConfig({ google: data.google === true, email: data.email === true, scenario: data.scenario === true });
      })
      .catch(() => { if (!controller.signal.aborted) setConfig(DISABLED); })
      .finally(() => { if (!controller.signal.aborted) setReady(true); });
    const client = getBrowserAuthClient();
    const subscription = client?.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted.current) {
        quotaRequest.current += 1;
        setSession(nextSession);
        setQuota(null);
        setErrorCode("");
      }
    }).data.subscription;
    void client?.auth.getSession().then(({ data, error }) => {
      if (mounted.current) setSession(error ? null : data.session);
    }).catch(() => { if (mounted.current) setSession(null); });
    return () => {
      mounted.current = false;
      controller.abort();
      subscription?.unsubscribe();
      quotaRequest.current += 1;
    };
  }, []);

  const refreshQuota = useCallback(() => {
    const requestId = ++quotaRequest.current;
    if (!config.scenario) return Promise.resolve();
    return getScenarioAccessToken().then(async (token) => {
      if (!token) { if (mounted.current && requestId === quotaRequest.current) setQuota(null); return; }
      const response = await fetch("/api/scenario/generate", {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      const data = await response.json();
      if (!mounted.current || requestId !== quotaRequest.current) return;
      if (response.ok && Number.isInteger(data.remaining) && Number.isInteger(data.limit)) {
        setQuota(data);
        setErrorCode(data.code && data.code !== "ALLOWED" ? data.code : "");
      } else {
        setQuota(null);
        setErrorCode(data.code || "AI_UNAVAILABLE");
      }
    }).catch(() => {
      if (mounted.current && requestId === quotaRequest.current) { setQuota(null); setErrorCode("AI_UNAVAILABLE"); }
    });
  }, [config.scenario]);

  useEffect(() => {
    void refreshQuota();
  }, [session?.access_token, refreshQuota]);

  const signOut = useCallback(async () => {
    const client = getBrowserAuthClient();
    if (!client) return;
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) setErrorCode("AUTH_REQUIRED");
    else { setSession(null); setQuota(null); setErrorCode(""); }
  }, []);

  return { config, ready, session, quota, errorCode, refreshQuota, signOut };
}

const COPY = {
  ko: { account: "AI 시나리오 계정", login: "로그인", logout: "로그아웃", hint: "Google 또는 이메일로 로그인할 수 있습니다. 한국 휴대전화 인증은 필요하지 않습니다.", remaining: "오늘 남은 생성", reset: "한도 갱신", public: "도감, 무료 템플릿과 설화 작업실은 로그인 없이 이용할 수 있습니다.", waiting: "AI 생성을 준비 중입니다. 무료 템플릿과 설화 작업실을 이용해 주세요.", loading: "이용 가능 여부를 확인하고 있습니다." },
  en: { account: "AI scenario account", login: "Sign in", logout: "Sign out", hint: "Sign in with Google or email. No Korean phone number is required.", remaining: "Generations left today", reset: "Allowance resets", public: "The atlas, free templates and writer studio are open without an account.", waiting: "AI generation is not available yet. Free templates and the writer studio remain open.", loading: "Checking availability." },
  ja: { account: "AIシナリオのアカウント", login: "ログイン", logout: "ログアウト", hint: "Googleまたはメールでログインできます。韓国の電話番号は不要です。", remaining: "本日の残り生成回数", reset: "上限の更新", public: "図鑑、無料テンプレート、執筆スタジオはログインなしで利用できます。", waiting: "AI生成は準備中です。無料テンプレートと執筆スタジオをご利用ください。", loading: "利用状況を確認しています。" },
  zh: { account: "AI剧本账号", login: "登录", logout: "退出登录", hint: "使用Google或邮箱登录，无需韩国手机号。", remaining: "今日剩余生成次数", reset: "额度重置", public: "图鉴、免费模板和写作工作室无需登录即可使用。", waiting: "AI生成正在准备中，免费模板和写作工作室仍可使用。", loading: "正在检查可用状态。" },
};

export default function ScenarioAuth({ auth, locale, onLogin }: { auth: ReturnType<typeof useScenarioAuth>; locale: string; onLogin?: MouseEventHandler<HTMLAnchorElement> }) {
  const lang = locale in COPY ? locale as keyof typeof COPY : "en";
  const copy = COPY[lang];
  const providerHint = {
    ko: auth.config.google ? "Google로 로그인할 수 있습니다. 한국 휴대전화 인증은 필요하지 않습니다." : "이메일로 로그인할 수 있습니다. 한국 휴대전화 인증은 필요하지 않습니다.",
    en: auth.config.google ? "Sign in with Google. No Korean phone number is required." : "Sign in with email. No Korean phone number is required.",
    ja: auth.config.google ? "Googleでログインできます。韓国の電話番号は不要です。" : "メールでログインできます。韓国の電話番号は不要です。",
    zh: auth.config.google ? "使用Google登录，无需韩国手机号。" : "使用邮箱登录，无需韩国手机号。",
  }[lang];
  const resetDate = auth.quota?.resetAt ? new Date(auth.quota.resetAt) : null;
  return <section aria-label={copy.account} style={{ border: "1px solid #3b3055", background: "#15111e", color: "#d9d1e7", padding: 16, borderRadius: 12, fontSize: 13, lineHeight: 1.7, margin: "0 auto 20px", maxWidth: 540 }}>
    {!auth.ready ? <p>{copy.loading}</p> : !auth.config.scenario ? <p>{copy.waiting}</p> : null}
    {auth.session ? <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ overflowWrap: "anywhere" }}>{auth.session.user.email}</span>
        <button onClick={() => void auth.signOut()} style={{ color: "#c4b5fd", cursor: "pointer", textDecoration: "underline" }}>{copy.logout}</button>
      </div>
      {auth.quota && <p>{copy.remaining}: <strong>{auth.quota.remaining} / {auth.quota.limit}</strong></p>}
      {resetDate && !Number.isNaN(resetDate.getTime()) && <p style={{ fontSize: 11, color: "#aaa" }}>{copy.reset}: {resetDate.toLocaleString(lang)}</p>}
      {auth.errorCode && <p role="status">{scenarioErrorMessage(auth.errorCode, lang)}</p>}
    </> : (auth.config.google || auth.config.email) ? <>
      <p>{auth.config.google && auth.config.email ? copy.hint : providerHint}</p>
      <a href={`/${lang}/login`} onClick={onLogin} style={{ display: "inline-block", marginTop: 10, padding: "8px 20px", borderRadius: 20, background: "#6d28d9", color: "#fff", fontWeight: 600 }}>{copy.login}</a>
    </> : null}
    <p style={{ fontSize: 11, color: "#aaa", marginTop: 10 }}>{copy.public}</p>
  </section>;
}

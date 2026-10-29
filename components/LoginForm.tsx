"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getBrowserAuthClient } from "@/lib/supabase-browser";
import { useScenarioAuth } from "@/components/ScenarioAuth";

const COPY = {
  ko: { title: "Mythoria 로그인", intro: "AI 시나리오를 위한 계정입니다. 도감과 무료 창작 도구는 로그인 없이 사용할 수 있습니다.", google: "Google로 계속", email: "이메일", send: "로그인 메일 받기", sending: "처리 중…", code: "이메일 인증 코드", verify: "코드로 로그인", sent: "로그인 메일을 보냈습니다. 메일의 링크를 열거나 인증 코드를 입력해 주세요.", resend: "다른 이메일 사용", unavailable: "로그인 서비스를 준비 중입니다. 도감과 무료 템플릿은 계속 사용할 수 있습니다.", failed: "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.", badCode: "코드가 올바르지 않거나 만료되었습니다. 메일을 다시 요청해 주세요.", rate: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", signedIn: "로그인되었습니다", continue: "Mythoria로 돌아가기", signOut: "로그아웃", noPhone: "한국 휴대전화 번호가 필요하지 않습니다.", loading: "로그인 서비스를 확인하고 있습니다.", wait: "다시 보내기까지" },
  en: { title: "Sign in to Mythoria", intro: "An account for AI scenarios. The atlas and free creative tools are open without signing in.", google: "Continue with Google", email: "Email", send: "Send sign-in email", sending: "Please wait…", code: "Email verification code", verify: "Sign in with code", sent: "Check your inbox. Open the sign-in link or enter the verification code from your email.", resend: "Use another email", unavailable: "Sign-in is being prepared. The atlas and free templates remain available.", failed: "Sign-in could not be completed. Please try again shortly.", badCode: "The code is incorrect or has expired. Request a new email.", rate: "Too many requests. Please wait before trying again.", signedIn: "You are signed in", continue: "Return to Mythoria", signOut: "Sign out", noPhone: "No Korean phone number is required.", loading: "Checking sign-in availability.", wait: "Resend available in" },
  ja: { title: "Mythoriaにログイン", intro: "AIシナリオ用のアカウントです。図鑑と無料創作ツールはログインなしで利用できます。", google: "Googleで続ける", email: "メールアドレス", send: "ログインメールを送信", sending: "処理中…", code: "メールの確認コード", verify: "コードでログイン", sent: "メールを送信しました。メールのリンクを開くか、確認コードを入力してください。", resend: "別のメールを使う", unavailable: "ログインサービスは準備中です。図鑑と無料テンプレートは利用できます。", failed: "ログインできませんでした。しばらくしてから再試行してください。", badCode: "コードが無効か期限切れです。メールを再度送信してください。", rate: "リクエストが多すぎます。しばらくお待ちください。", signedIn: "ログインしました", continue: "Mythoriaに戻る", signOut: "ログアウト", noPhone: "韓国の電話番号は不要です。", loading: "ログインの利用状況を確認しています。", wait: "再送信まで" },
  zh: { title: "登录Mythoria", intro: "此账号用于AI剧本创作。图鉴和免费创作工具无需登录即可使用。", google: "使用Google继续", email: "邮箱地址", send: "发送登录邮件", sending: "处理中…", code: "邮箱验证码", verify: "使用验证码登录", sent: "登录邮件已发送，请打开邮件中的链接或输入验证码。", resend: "使用其他邮箱", unavailable: "登录服务正在准备中，图鉴和免费模板仍可使用。", failed: "登录未完成，请稍后重试。", badCode: "验证码错误或已过期，请重新发送邮件。", rate: "请求过多，请稍后重试。", signedIn: "登录成功", continue: "返回Mythoria", signOut: "退出登录", noPhone: "无需韩国手机号。", loading: "正在检查登录服务。", wait: "距离重新发送" },
};

export default function LoginForm({ locale }: { locale: string }) {
  const lang = locale in COPY ? locale as keyof typeof COPY : "en";
  const copy = COPY[lang];
  const auth = useScenarioAuth();
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("error") || new URLSearchParams(url.hash.slice(1)).has("error")) setError(copy.failed);
  }, [copy.failed]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function showError(value: { status?: number; code?: string } | null, codeFailure = false) {
    setError(value?.status === 429 || value?.code?.includes("rate_limit") ? copy.rate : codeFailure ? copy.badCode : copy.failed);
  }

  async function googleLogin() {
    if (busy || !auth.config.google) return;
    const client = getBrowserAuthClient();
    if (!client) { setError(copy.unavailable); return; }
    setBusy(true); setError("");
    try {
      const { error: oauthError } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/${lang}/login` } });
      if (oauthError) showError(oauthError);
    } catch { setError(copy.failed); }
    finally { setBusy(false); }
  }

  async function sendEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || cooldown || !auth.config.email) return;
    const client = getBrowserAuthClient();
    if (!client) { setError(copy.unavailable); return; }
    const address = email.trim();
    setBusy(true); setError("");
    try {
      const { error: emailError } = await client.auth.signInWithOtp({ email: address, options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/${lang}/login`, data: { locale: lang } } });
      if (emailError) showError(emailError);
      else { setSentEmail(address); setCode(""); setCooldown(60); }
    } catch { setError(copy.failed); }
    finally { setBusy(false); }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !sentEmail) return;
    const client = getBrowserAuthClient();
    if (!client) { setError(copy.unavailable); return; }
    setBusy(true); setError("");
    try {
      const { error: verifyError } = await client.auth.verifyOtp({ email: sentEmail, token: code.trim(), type: "email" });
      if (verifyError) showError(verifyError, true);
    } catch { setError(copy.failed); }
    finally { setBusy(false); }
  }

  const button = "w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50";
  const input = "mt-2 w-full rounded-xl border border-neutral-600 bg-neutral-950 px-4 py-3 text-white outline-offset-4 focus:outline-violet-400";
  const dataNotice = {
    ko: "이메일과 계정 ID는 로그인과 AI 사용 한도 관리에 사용됩니다. AI 생성을 누르면 입력 내용이 OpenAI로 전송됩니다. 무료 템플릿은 브라우저에서 작동합니다.",
    en: "Your email and account ID are used for sign-in and AI allowances. When you request AI generation, your inputs are sent to OpenAI. Free templates run in your browser.",
    ja: "メールアドレスとアカウントIDはログインとAI利用上限の管理に使われます。AI生成を実行すると入力内容がOpenAIに送信されます。無料テンプレートはブラウザで動作します。",
    zh: "邮箱和账号ID用于登录及AI使用额度管理。点击AI生成后，输入内容将发送至OpenAI。免费模板在浏览器中运行。",
  }[lang];
  return <main lang={lang} className="min-h-screen bg-[#0d0b12] px-5 py-16 text-neutral-100">
    <div className="mx-auto max-w-md">
      <a href={`/?lang=${lang}`} className="text-sm tracking-[0.2em] text-violet-300">MYTHORIA</a>
      <section className="mt-8 rounded-2xl border border-neutral-800 bg-[#17131f] p-7">
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">{copy.intro}</p>
        {auth.session ? <div className="mt-7 space-y-4">
          <p role="status" className="text-emerald-300">{copy.signedIn}</p>
          <p className="break-all text-sm">{auth.session.user.email}</p>
          <a href={`/?lang=${lang}`} className={`${button} block text-center`}>{copy.continue}</a>
          <button type="button" onClick={() => void auth.signOut()} className="text-sm text-neutral-400 underline">{copy.signOut}</button>
        </div> : <div className="mt-7 space-y-5">
          {!auth.ready ? <p role="status">{copy.loading}</p> : !(auth.config.google || auth.config.email) ? <p role="status" className="text-sm leading-6 text-amber-200">{copy.unavailable}</p> : null}
          {auth.config.google && <button type="button" disabled={busy} onClick={() => void googleLogin()} className={button}>{busy ? copy.sending : copy.google}</button>}
          {auth.config.email && <>
            <form onSubmit={sendEmail} className="space-y-4">
              <label className="block text-sm">{copy.email}<input type="email" name="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy || !!sentEmail} className={input} placeholder="you@example.com" /></label>
              {!sentEmail && <button type="submit" disabled={busy || cooldown > 0} className={button}>{busy ? copy.sending : cooldown ? `${copy.wait} ${cooldown}s` : copy.send}</button>}
            </form>
            {sentEmail && <>
              <p role="status" className="text-sm leading-6 text-violet-200">{copy.sent}</p>
              <form onSubmit={verifyCode} className="space-y-4">
                <label className="block text-sm">{copy.code}<input name="code" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={10} pattern="[0-9]{6,10}" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} disabled={busy} className={input} /></label>
                <button type="submit" disabled={busy} className={button}>{busy ? copy.sending : copy.verify}</button>
              </form>
              <button type="button" disabled={busy} onClick={() => { setSentEmail(""); setCode(""); setError(""); }} className="text-sm text-neutral-400 underline">{copy.resend}</button>
            </>}
          </>}
          {error && <p role="alert" className="rounded-lg bg-red-950/50 p-3 text-sm text-red-200">{error}</p>}
          <p className="text-xs leading-5 text-neutral-500">{copy.noPhone}</p>
        </div>}
      </section>
      <p className="mt-5 text-xs leading-5 text-neutral-500">{dataNotice}</p>
      <a href={`/?lang=${lang}`} className="mt-6 inline-block text-sm text-neutral-400 underline">{copy.continue}</a>
      <nav aria-label="Language" className="mt-8 flex gap-5 text-sm text-neutral-500">{(["ko", "en", "ja", "zh"] as const).map((item) => <a key={item} href={`/${item}/login`} hrefLang={item} aria-current={item === lang ? "page" : undefined}>{({ ko: "한국어", en: "English", ja: "日本語", zh: "中文" })[item]}</a>)}</nav>
    </div>
  </main>;
}

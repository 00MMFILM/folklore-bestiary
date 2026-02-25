import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["ko", "en"];

// Paths that should NOT be locale-prefixed
const SKIP_PREFIXES = ["/api/", "/_next/", "/creatures/", "/og-"];
const SKIP_EXACT = ["/", "/sitemap.xml", "/robots.txt"];

function shouldSkip(pathname: string): boolean {
  if (SKIP_EXACT.includes(pathname)) return true;
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // Static files
  if (pathname.includes(".")) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkip(pathname)) return NextResponse.next();

  // Already has a valid locale prefix — pass through
  const segments = pathname.split("/");
  if (segments.length >= 2 && LOCALES.includes(segments[1])) {
    return NextResponse.next();
  }

  // No locale prefix on an SEO path — redirect to /ko/...
  const url = request.nextUrl.clone();
  url.pathname = `/ko${pathname}`;
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: [
    // Match all paths except static files and api
    "/((?!_next|api|creatures|favicon|og-|sitemap|robots).*)",
  ],
};

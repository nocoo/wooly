import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function buildRedirectUrl(req: NextRequest, pathname: string): URL {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const proto = forwardedProto ?? req.nextUrl.protocol.replace(":", "");

  if (host) {
    return new URL(pathname, `${proto}://${host}`);
  }

  return new URL(pathname, req.nextUrl.origin);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Dev-only visual snapshot bypass — see docs/07-ui-design-audit.md §3.5.1.
  // Two guards: NODE_ENV must not be production AND env flag must be "true".
  // Production builds short-circuit on the NODE_ENV check, so this branch
  // can never run in deployed environments.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.WOOLY_VISUAL_BYPASS_AUTH === "true"
  ) {
    return NextResponse.next();
  }

  // Allow public routes: /login, /api/auth/*, static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/logo-")
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to /login
  if (!req.auth) {
    const loginUrl = buildRedirectUrl(req, "/login");
    const callbackPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    const callbackUrl = buildRedirectUrl(req, callbackPath).toString();
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|logo-).*)"],
};

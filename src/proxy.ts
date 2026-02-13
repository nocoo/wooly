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

  // Allow public routes: /login, /api/auth/*, static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo")
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
  matcher: ["/((?!_next/static|_next/image|favicon\\.png|logo/).*)"],
};

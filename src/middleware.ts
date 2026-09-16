import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("aj_auth_token")?.value;
  const { pathname } = request.nextUrl;
  const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";

  // Rate Limiting on sensitive endpoints (PRD Section 19.7)
  if (pathname.startsWith("/api/")) {
    const isAuthEndpoint = pathname.startsWith("/api/auth");
    const limitOptions = isAuthEndpoint
      ? { windowMs: 60 * 1000, maxRequests: 15, prefix: "auth" } // 15 requests/min for auth
      : { windowMs: 60 * 1000, maxRequests: 120, prefix: "api" }; // 120 requests/min for API

    const rateResult = checkRateLimit(clientIp, limitOptions);

    if (!rateResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "TOO_MANY_REQUESTS: Rate limit exceeded. Please wait before retrying.",
          retryAfterSeconds: rateResult.resetInSeconds,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": rateResult.resetInSeconds.toString(),
          },
        }
      );
    }
  }

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/request-access") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/access-requests") ||
    pathname.startsWith("/api/media/file") ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico");


  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and visits /login or /register, redirect to /archive
  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/archive", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files & images
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

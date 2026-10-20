import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "piocart_token";

// Only checks that a session cookie exists; the backend still validates the token and roles on every call.
export function proxy(request: NextRequest) {
  if (request.cookies.has(TOKEN_COOKIE)) {
    return NextResponse.next();
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("returnTo", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*"],
};

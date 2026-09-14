import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const inactiveMessage = "CuentaDesactivada";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? "",
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.active === false) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", inactiveMessage);
    const response = NextResponse.redirect(loginUrl);

    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    return response;
  }

  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    token.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/board/:path*", "/admin/:path*"],
};
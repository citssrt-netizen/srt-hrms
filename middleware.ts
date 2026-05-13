import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifyEdgeSessionToken,
} from "@/lib/auth/edge-session";
import {
  canAccessRoute,
  isEmployeePortalRoute,
  isEmployerRoute,
} from "@/lib/auth/roles";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    isEmployeePortalRoute(pathname) || isEmployerRoute(pathname);

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  const session = await verifyEdgeSessionToken(token);

  if (!session) {
    return redirectToLogin(request);
  }

  if (!canAccessRoute(session.role, pathname)) {
    if (session.role === "employee") {
      return NextResponse.redirect(new URL("/employee-portal", request.url));
    }

    if (session.role === "employer") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return redirectToLogin(request);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export const config = {
  matcher: [
    "/employee-portal/:path*",
    "/employees/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
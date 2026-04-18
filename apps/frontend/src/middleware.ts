import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

const protectedPrefixes = [
  "/profile",
  "/cart",
  "/checkout",
  "/wishlist",
  "/order-history",
  "/order-track",
];

const hasSessionCookie = (request: NextRequest) =>
  SESSION_COOKIE_NAMES.some((name) => Boolean(request.cookies.get(name)?.value));

const getBackendBase = () =>
  (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL)?.replace(
    /\/$/,
    "",
  );

const isBackendSameOrigin = (request: NextRequest) => {
  const backendBase = getBackendBase();
  if (!backendBase) return false;

  try {
    return new URL(backendBase).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
};

const cookieHeader = (request: NextRequest) =>
  request.cookies
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

async function isAdminRequest(request: NextRequest) {
  const backendBase = getBackendBase();
  const cookie = cookieHeader(request);

  if (!backendBase || !cookie) {
    return false;
  }

  try {
    const res = await fetch(`${backendBase}/api/v1/users/admin`, {
      headers: {
        cookie,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    return res.ok;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const canUseFrontendCookiesForAuth = isBackendSameOrigin(request);

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!canUseFrontendCookiesForAuth) {
      return NextResponse.next();
    }

    if (await isAdminRequest(request)) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!canUseFrontendCookiesForAuth) {
      return NextResponse.next();
    }

    if (hasSessionCookie(request)) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile",
    "/cart",
    "/checkout",
    "/wishlist",
    "/order-history/:path*",
    "/order-track",
  ],
};

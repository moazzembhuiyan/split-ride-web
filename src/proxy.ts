import { type NextRequest, NextResponse } from "next/server";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = Buffer.from(base64, "base64url").toString("utf-8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}


function isPublic(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/auth/register" ||
    pathname === "/terms" ||
    pathname === "/admin/auth/login" ||
    pathname === "/admin/auth"
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // The page itself signs out: the socket, caches and refresh token live in
  // the browser and cannot be cleared from here.
  if (pathname === "/logout") {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    if (isPublic(pathname)) return NextResponse.next();
    const loginUrl = pathname.startsWith("/admin")
      ? "/admin/auth/login"
      : "/";
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  const payload = decodeJwtPayload(token);
  const role = payload?.role as string | undefined;

  if (pathname === "/terms") {
    return NextResponse.next();
  }

  // Redirect away from public auth pages if already logged in
  if (isPublic(pathname)) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (role === "provider") {
      return NextResponse.redirect(new URL("/driver", request.url));
    }

    // User stays on the landing page
    return NextResponse.next();
  }

  // Admin routes: only admin role allowed
  if (pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Driver routes: only provider role allowed
  if (pathname.startsWith("/driver")) {
    if (role !== "provider") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Shared routes: accessible by both drivers and passengers
  if (pathname === "/message" || pathname.startsWith("/message/")) {
    return NextResponse.next();
  }
  if (pathname === "/help" || pathname === "/support") {
    if (role === "provider") {
      return NextResponse.redirect(new URL("/driver/help", request.url));
    }
    return NextResponse.next();
  }
  if (pathname === "/auth/register/info" || pathname.startsWith("/auth/register/info")) {
    return NextResponse.next();
  }

  // Passenger routes: only user role allowed
  if (role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }
  if (role === "provider") {
    return NextResponse.redirect(new URL("/driver", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

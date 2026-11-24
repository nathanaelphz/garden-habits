import { NextResponse, type NextRequest } from "next/server";
import { isValidSession, SESSION_COOKIE } from "@/lib/auth";

// Optimistic gate. Signed out: "/" shows the landing page, anything else goes to
// /login and comes back afterwards. Server Actions and pages re-check the session,
// so this isn't the only line of defence.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await isValidSession(token)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  if (pathname === "/") return NextResponse.rewrite(new URL("/landing/index.html", request.url));
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except login, the landing page, public gardens, the cron endpoint,
  // the PWA files, Next internals and static files.
  matcher: [
    "/((?!login|landing/|g/|api/cron|sw\\.js|manifest\\.webmanifest|icons/|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|svg|jpg|ico|webp|woff2|css|js)$).*)",
  ],
};

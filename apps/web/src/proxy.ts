import { NextResponse, type NextRequest } from "next/server";
import {
  UI_AUTH_COOKIE_NAME,
  hasValidPasswordCookie,
  normalizeNextPath,
  shouldProtectUi,
} from "./server/uiPasswordGate";

const UNLOCK_PATH = "/unlock";

export function proxy(request: NextRequest) {
  if (!shouldProtectUi(process.env)) {
    return NextResponse.next();
  }

  const password = process.env.PASSWORD;
  if (!password) {
    return new NextResponse("PASSWORD is not configured.", { status: 503 });
  }

  const cookiePassword = request.cookies.get(UI_AUTH_COOKIE_NAME)?.value;
  const hasAuthCookie = hasValidPasswordCookie({
    cookiePassword,
    password,
  });

  if (request.nextUrl.pathname === UNLOCK_PATH) {
    if (!hasAuthCookie) {
      return NextResponse.next();
    }

    const nextPath = normalizeNextPath(request.nextUrl.searchParams.get("next"));
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = nextPath;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (hasAuthCookie) {
    return NextResponse.next();
  }

  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = UNLOCK_PATH;
  unlockUrl.search = "";
  unlockUrl.searchParams.set(
    "next",
    normalizeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`),
  );
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: [
    // UI only: API routes are excluded to avoid impacting external integrations.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { isAuthorizedByPassword, shouldProtectUi } from "./server/uiPasswordGate";

const WWW_AUTHENTICATE_VALUE = 'Basic realm="merchandise-sales-automation"';

export function proxy(request: NextRequest) {
  if (!shouldProtectUi(process.env)) {
    return NextResponse.next();
  }

  const password = process.env.PASSWORD;
  if (!password) {
    return new NextResponse("PASSWORD is not configured.", { status: 503 });
  }

  if (
    isAuthorizedByPassword({
      authorizationHeader: request.headers.get("authorization"),
      password,
    })
  ) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": WWW_AUTHENTICATE_VALUE,
    },
  });
}

export const config = {
  matcher: [
    // UI only: API routes are excluded to avoid impacting external integrations.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};


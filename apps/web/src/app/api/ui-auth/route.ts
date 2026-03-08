import { NextResponse } from "next/server";
import {
  UI_AUTH_COOKIE_NAME,
  normalizeNextPath,
  shouldProtectUi,
} from "@/server/uiPasswordGate";

const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

const createUnlockUrl = (request: Request, params: { next: string; error?: string }) => {
  const unlockUrl = new URL("/unlock", request.url);
  unlockUrl.searchParams.set("next", params.next);
  if (params.error) {
    unlockUrl.searchParams.set("error", params.error);
  }
  return unlockUrl;
};

export async function POST(request: Request) {
  const rootUrl = new URL("/", request.url);
  if (!shouldProtectUi(process.env)) {
    return NextResponse.redirect(rootUrl);
  }

  const password = process.env.PASSWORD;
  if (!password) {
    return new NextResponse("PASSWORD is not configured.", { status: 503 });
  }

  const formData = await request.formData();
  const formPassword = formData.get("password");
  const nextValue = formData.get("next");
  const nextPath = normalizeNextPath(typeof nextValue === "string" ? nextValue : null);

  if (typeof formPassword !== "string" || formPassword !== password) {
    return NextResponse.redirect(
      createUnlockUrl(request, { next: nextPath, error: "1" }),
    );
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  response.cookies.set({
    name: UI_AUTH_COOKIE_NAME,
    value: password,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_WEEK_SECONDS,
  });
  return response;
}


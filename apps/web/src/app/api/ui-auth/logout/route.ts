import { NextResponse } from "next/server";
import { UI_AUTH_COOKIE_NAME } from "@/server/uiPasswordGate";

const SEE_OTHER = 303;

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/unlock", request.url), SEE_OTHER);
  response.cookies.set({
    name: UI_AUTH_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
  });

  return response;
}

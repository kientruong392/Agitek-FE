import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { signIn } from "@/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const refreshToken = searchParams.get("refreshToken");

  if (token && refreshToken) {
    try {
      await signIn("credentials", {
        accessToken: token,
        refreshToken: refreshToken,
        isExternal: true,
        redirect: false,
      });
    } catch(e) {
      console.error("Error setting external tokens:", e);
    }
  }

  // Redirect to home page after successful login
  return NextResponse.redirect(new URL("/", request.url));
}

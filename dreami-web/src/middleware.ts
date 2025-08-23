// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  if (url.hostname === "dreamiapp.com") {
    url.hostname = "www.dreamiapp.com";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

// don’t redirect Next assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|site.webmanifest).*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Temporary bypass for UI preview — restore auth guard before deploying
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|alk_logo.jpg).*)"],
};

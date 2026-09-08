import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const origin =
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_ORIGIN || "https://panel.redaxify.com"
      : process.env.LOCAL_FRONTEND_ORIGIN || "http://localhost:3000";

  // for preflight request
  if (req.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    preflight.headers.set("Access-Control-Allow-Origin", origin);
    preflight.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    preflight.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    preflight.headers.set("Access-Control-Allow-Credentials", "true");
    return preflight;
  }

  // cors headers for all other requests
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}

export const config = {
  matcher: "/api/:path*",
};

 
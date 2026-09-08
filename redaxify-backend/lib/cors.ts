import { NextResponse } from "next/server";

export function setCorsHeaders(res: NextResponse | Response) {
  const origin =
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_ORIGIN || "https://panel.redaxify.com"
      : process.env.LOCAL_FRONTEND_ORIGIN || "http://localhost:3000";

  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PATCH, DELETE"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
}

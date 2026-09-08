//app/api/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL || "http://localhost:4000";

export async function GET(req: NextRequest) {
  return proxyRequest(req);
}

export async function POST(req: NextRequest) {
  return proxyRequest(req);
}

export async function PUT(req: NextRequest) {
  return proxyRequest(req);
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req);
}

async function proxyRequest(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("Proxying request:", req.method, req.url);
    const targetPath = req.nextUrl.searchParams.get("url");

    if (!targetPath) {
      return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
    }

    const targetUrl = `${BACKEND_BASE_URL}${targetPath}`;

    const headers = new Headers(req.headers);
    headers.set("host", new URL(BACKEND_BASE_URL).host);
    headers.set("origin", BACKEND_BASE_URL);
    headers.delete("content-length");

    // Forward body if method allows
    const method = req.method;
    const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const body = hasBody ? await req.text() : undefined;

    // backend request
    const backendResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
      credentials: "include",
    });

    // Clone the response to be able to read it multiple times
    const responseClone = backendResponse.clone();

    let responseData;
    let isJson = false;

    try {
      responseData = await backendResponse.json();
      isJson = true;
    } catch {
      // fallback: if response not JSON, get text
      responseData = await responseClone.text();
      isJson = false;
    }

    // Return appropriate response
    if (isJson) {
      const response = NextResponse.json(responseData, {
        status: backendResponse.status,
      });

      // forward set-cookie header if present
      const setCookie = backendResponse.headers.get("set-cookie");
      if (setCookie) {
        response.headers.set("set-cookie", setCookie);
      }

      return response;
    } else {
      return new NextResponse(responseData, {
        status: backendResponse.status,
        headers: backendResponse.headers,
      });
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Proxy request failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

const API_TARGET = process.env.API_SERVER_URL?.trim() || "https://quizai-api.onrender.com";

const FORWARDED_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "x-requested-with",
] as const;

const buildTargetUrl = (path: string[], searchParams: URLSearchParams): string => {
  const normalizedPath = path.join("/");
  const query = searchParams.toString();
  return `${API_TARGET}/${normalizedPath}${query ? `?${query}` : ""}`;
};

const proxyRequest = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) => {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(path, request.nextUrl.searchParams);
  const headers = new Headers();

  FORWARDED_HEADERS.forEach((header) => {
    const value = request.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  });

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;

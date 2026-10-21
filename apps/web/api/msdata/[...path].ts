export const config = { runtime: "edge" };

const DEFAULT_UPSTREAM = "https://sports-api.sportsdata365.com/msdata";

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const incoming = new URL(request.url);
  const suffix = incoming.pathname.replace(/^\/api\/msdata/, "").replace(/^\/msdata/, "");
  if (!suffix.startsWith("/v1/baseball")) {
    return Response.json({ error: "Only /v1/baseball is proxied" }, { status: 400 });
  }

  const upstream = (process.env.MSDATA_BASE_URL || DEFAULT_UPSTREAM).replace(/\/$/, "");
  const headers = new Headers({ accept: "application/json" });
  const apim = process.env.MSDATA_API_KEY;
  const live = process.env.MSDATA_LIVE_KEY;
  if (apim) headers.set("x-apim-key", apim);
  if (live) headers.set("X-Live-Key", live);

  const response = await fetch(`${upstream}${suffix}${incoming.search}`, { method: request.method, headers });
  const body = await response.arrayBuffer();
  const out = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) out.set("content-type", contentType);
  return new Response(body, { status: response.status, headers: out });
}

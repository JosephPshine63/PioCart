import { backendUrl } from "@/lib/api/client";

// Streams product images from the backend so the browser never talks to it directly.
export async function GET(_request: Request, { params }: RouteContext<"/api/images/[id]">) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return new Response(null, { status: 400 });
  }

  const upstream = await fetch(backendUrl(`/images/image/download/${id}`));
  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.status === 404 ? 404 : 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

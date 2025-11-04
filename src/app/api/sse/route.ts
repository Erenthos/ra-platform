// --- Node-only runtime ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest } from "next/server";
import { registerClient, removeClient } from "./broadcaster";

export async function GET(req: NextRequest) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const clientId = registerClient(writer);

  // Send initial connection message
  writer.write(new TextEncoder().encode(`event: connected\ndata: connected-${clientId}\n\n`));

  // Cleanup on close
  req.signal.addEventListener("abort", () => removeClient(clientId));

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

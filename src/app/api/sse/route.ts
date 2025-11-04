// --- Force runtime execution only ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
  // Lazy import to prevent build-time execution
  const SSEChannel = (await import("sse-channel")).default;

  const channel = new SSEChannel({
    historySize: 0,
    retryTimeout: 3000,
  });

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => controller.enqueue(`data: ${data}\n\n`);
      const sendKeepAlive = setInterval(() => send("ping"), 15000);

      channel.on("message", (msg: string) => send(JSON.stringify(msg)));

      _req.signal.addEventListener("abort", () => {
        clearInterval(sendKeepAlive);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

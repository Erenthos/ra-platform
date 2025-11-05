import { NextRequest } from "next/server";
import { SSEEmitter } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Send connection acknowledgement
      send({ type: "connected" });

      // Listener for updates
      const listener = (update: any) => send(update);
      SSEEmitter.on("update", listener);

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        SSEEmitter.removeListener("update", listener);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

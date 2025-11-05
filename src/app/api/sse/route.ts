import { NextRequest } from "next/server";
import { EventEmitter } from "events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emitter = new EventEmitter();

// Limit max listeners to avoid warnings
emitter.setMaxListeners(50);

// Called by clients to subscribe
export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Send initial connection event
      send({ type: "connected" });

      // Listen for updates
      const listener = (update: any) => send(update);
      emitter.on("update", listener);

      req.signal.addEventListener("abort", () => {
        emitter.removeListener("update", listener);
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

// Function for other APIs to trigger live updates
export function broadcastBidUpdate(auctionId: number) {
  emitter.emit("update", { type: "bid_update", auctionId });
}

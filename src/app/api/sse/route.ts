import { NextRequest } from "next/server";
import { auctionChannel } from "@/lib/sse";

// this is a streaming route (Server-Sent Events)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // attach listener
  const listener = (message: any) => {
    writer.write(
      `event: ${message.event}\ndata: ${JSON.stringify(message.data)}\n\n`
    );
  };

  auctionChannel.on("send", listener);

  // cleanup on disconnect
  req.signal.addEventListener("abort", () => {
    auctionChannel.removeListener("send", listener);
    writer.close();
  });

  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  const encoder = new TextEncoder();
  writer.write(encoder.encode("event: ping\ndata: connected\n\n"));

  return new Response(readable, { headers });
}

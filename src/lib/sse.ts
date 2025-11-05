// src/lib/sse.ts
import SSEChannel from "sse-channel";

// a shared SSE channel instance
export const auctionChannel = new SSEChannel({ jsonEncode: true });

// helper to broadcast bid updates
export function broadcastBidUpdate(auctionId: number) {
  auctionChannel.send({
    event: "bidUpdate",
    data: { auctionId, timestamp: new Date().toISOString() },
  });
  console.log("🔊 Broadcasted bid update for auction:", auctionId);
}

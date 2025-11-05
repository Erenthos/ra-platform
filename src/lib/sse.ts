// src/lib/sse.ts
import { EventEmitter } from "events";

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

export const SSEEmitter = emitter;

export function broadcastBidUpdate(auctionId: number) {
  SSEEmitter.emit("update", { type: "bid_update", auctionId });
}

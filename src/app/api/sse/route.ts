// --- Node-only runtime ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

// Simple in-memory broadcaster for all connected clients
const clients: { id: number; res: WritableStreamDefaultWriter }[] = [];

export async function GET(req: NextRequest) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const clientId = Date.now();
  clients.push({ id: clientId, res: writer });

  console.log(`🔌 SSE client connected: ${clientId} (total ${clients.length})`);

  // Send an initial event so the browser knows connection succeeded
  writer.write(encoder(`event: connected\ndata: connected-${clientId}\n\n`));

  // Remove client on close
  const closeConn = () => {
    const idx = clients.findIndex((c) => c.id === clientId);
    if (idx >= 0) clients.splice(idx, 1);
    console.log(`❌ SSE client disconnected: ${clientId}`);
  };

  // Detect when the client closes the connection
  req.signal.addEventListener("abort", closeConn);

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// Utility encoder for writing messages
function encoder(data: string) {
  const enc = new TextEncoder();
  return enc.encode(data);
}

// --- Broadcast helper used by other routes ---
export async function broadcastBidUpdate(auctionId: number) {
  const prisma = new PrismaClient();
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        items: {
          include: {
            bids: { orderBy: { bidValue: "asc" }, take: 1 },
          },
        },
      },
    });

    if (!auction) return;

    const payload = {
      auctionId: auction.id,
      timestamp: new Date().toISOString(),
      items: auction.items.map((i) => ({
        itemId: i.id,
        currentMin: i.bids?.[0]?.bidValue ?? null,
      })),
    };

    const json = `event: bidUpdate\ndata: ${JSON.stringify(payload)}\n\n`;
    const encoded = encoder(json);

    for (const c of clients) {
      try {
        await c.res.write(encoded);
      } catch {
        // remove broken connections
        const idx = clients.findIndex((x) => x.id === c.id);
        if (idx >= 0) clients.splice(idx, 1);
      }
    }
    console.log(`📡 Broadcasted update for auction ${auctionId}`);
  } catch (err) {
    console.error("Broadcast error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

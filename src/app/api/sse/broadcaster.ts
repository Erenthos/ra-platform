// --- Broadcaster utility shared by /api/sse and /api/bids ---
import { PrismaClient } from "@prisma/client";

type Client = { id: number; res: WritableStreamDefaultWriter };
const clients: Client[] = [];

export function registerClient(writer: WritableStreamDefaultWriter) {
  const clientId = Date.now();
  clients.push({ id: clientId, res: writer });
  console.log(`🔌 SSE client connected: ${clientId} (total ${clients.length})`);
  return clientId;
}

export function removeClient(clientId: number) {
  const idx = clients.findIndex((c) => c.id === clientId);
  if (idx >= 0) clients.splice(idx, 1);
  console.log(`❌ SSE client disconnected: ${clientId}`);
}

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

    const data = `event: bidUpdate\ndata: ${JSON.stringify(payload)}\n\n`;
    const encoded = new TextEncoder().encode(data);

    for (const c of [...clients]) {
      try {
        await c.res.write(encoded);
      } catch {
        removeClient(c.id);
      }
    }

    console.log(`📡 Broadcasted update for auction ${auctionId}`);
  } catch (err) {
    console.error("Broadcast error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

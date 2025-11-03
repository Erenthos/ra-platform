import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  async function sendUpdate() {
    const bids = await prisma.bid.findMany({
      orderBy: { bidTime: 'desc' },
      take: 20,
      include: { item: true },
    });
    const payload = JSON.stringify(
      bids.map((b) => ({
        itemId: b.itemId,
        bidValue: b.bidValue,
        bidTime: b.bidTime,
      }))
    );
    await writer.write(encoder.encode(`data: ${payload}\n\n`));
  }

  async function poll() {
    while (true) {
      await sendUpdate();
      await new Promise((resolve) => setTimeout(resolve, 1500)); // every 1.5s
    }
  }

  poll();

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  return new Response(readable, { headers });
}

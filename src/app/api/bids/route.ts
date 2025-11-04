export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Submit bids for multiple items
export async function POST(request: NextRequest) {
  try {
    const { auctionId, bids } = await request.json();

    if (!auctionId || !bids) {
      return NextResponse.json({ error: 'Missing auctionId or bids' }, { status: 400 });
    }

    let placed = 0;

    for (const [itemIdStr, val] of Object.entries(bids || {})) {
      const itemId = Number(itemIdStr);
      const bidValue = Number(val);

      if (!bidValue || bidValue <= 0) continue;

      // Fetch current min bid and decrement step
      const item = await prisma.item.findUnique({ where: { id: itemId }, include: { auction: true } });
      if (!item) continue;

      const minBid = await prisma.bid.findFirst({ where: { itemId }, orderBy: { bidValue: 'asc' } });
      const currentMin = minBid ? minBid.bidValue : item.auction.startPrice;
      const decrement = item.auction.decrementStep;

      // Validate reverse auction rules
      if (bidValue >= currentMin) continue;
      if (((currentMin - bidValue) % decrement) !== 0) continue;

      // For demo, supplierId = 2 (replace with real auth later)
      await prisma.bid.create({ data: { itemId, supplierId: 2, bidValue } });
      placed++;
    }

    return NextResponse.json({ success: true, placed });
  } catch (error) {
    console.error('Error placing bids:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

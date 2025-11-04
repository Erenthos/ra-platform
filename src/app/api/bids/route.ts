// --- Node-only runtime (no pre-rendering) ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { broadcastBidUpdate } from "../sse/broadcaster";

export async function POST(request: NextRequest) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const body = await request.json();
    const { auctionId, bids, supplierId } = body;

    if (!auctionId || !Array.isArray(bids) || bids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: missing auctionId or bids array" },
        { status: 400 }
      );
    }

    // Fetch auction + items + existing bids
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        items: {
          include: {
            bids: { orderBy: { bidValue: "asc" } },
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status !== "LIVE") {
      return NextResponse.json(
        { error: "Auction is not currently live" },
        { status: 400 }
      );
    }

    const results: any[] = [];

    for (const b of bids) {
      const { itemId, bidValue } = b;
      if (!itemId || !bidValue || bidValue <= 0) continue;

      const item = auction.items.find((i) => i.id === itemId);
      if (!item) {
        results.push({ itemId, status: "Item not found" });
        continue;
      }

      const currentMin =
        item.bids.length > 0 ? item.bids[0].bidValue : auction.startPrice;
      const decrement = auction.decrementStep;

      if (bidValue >= currentMin || currentMin - bidValue < decrement) {
        results.push({
          itemId,
          status: `❌ Must be at least ${decrement} lower than current min (${currentMin})`,
        });
        continue;
      }

      const supplier = supplierId || 999; // temporary fallback

      await prisma.bid.create({
        data: {
          itemId,
          supplierId: supplier,
          bidValue,
        },
      });

      results.push({ itemId, status: "✅ Accepted", bidValue });
    }

    // Recalculate updated current mins
    const updatedAuction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        items: {
          include: {
            bids: { orderBy: { bidValue: "asc" }, take: 1 },
          },
        },
      },
    });

    // 🔥 Broadcast new lowest bids via SSE
    await broadcastBidUpdate(auctionId);

    const response = {
      message: "Bids processed successfully",
      results,
      updated: updatedAuction
        ? updatedAuction.items.map((i) => ({
            itemId: i.id,
            currentMin: i.bids?.[0]?.bidValue ?? null,
          }))
        : [],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error submitting bids:", error);
    return NextResponse.json(
      { error: "Server error submitting bids" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

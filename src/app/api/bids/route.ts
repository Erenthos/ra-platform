import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { broadcastBidUpdate } from "@/lib/sse";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { supplierId, auctionId, bids } = await req.json();

    if (!supplierId || !auctionId || !bids?.length) {
      return NextResponse.json(
        { error: "Missing fields: supplierId, auctionId, or bids" },
        { status: 400 }
      );
    }

    // Fetch auction and its items
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { items: true },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status !== "LIVE") {
      return NextResponse.json({ error: "Auction not LIVE" }, { status: 400 });
    }

    // Collect all new bids
    const newBids: any[] = [];

    for (const b of bids) {
      const { itemId, bidValue } = b;

      // Fetch current minimum bid
      const currentMin = await prisma.bid.findFirst({
        where: { itemId },
        orderBy: { bidValue: "asc" },
      });

      // Enforce decrement step rule
      if (
        currentMin &&
        bidValue >= currentMin.bidValue - auction.decrementStep
      ) {
        return NextResponse.json(
          {
            error: `Bid too high for item ${itemId}. Must be at least ${auction.decrementStep} less than current min.`,
          },
          { status: 400 }
        );
      }

      const newBid = await prisma.bid.create({
        data: {
          itemId,
          supplierId,
          bidValue,
        },
      });

      newBids.push(newBid);
    }

    // ✅ Broadcast to all clients listening via SSE
    broadcastBidUpdate(auctionId);

    return NextResponse.json({
      message: "Bids submitted successfully",
      bids: newBids,
    });
  } catch (error) {
    console.error("Error submitting bids:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

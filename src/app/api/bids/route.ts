import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { broadcastBidUpdate } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { itemId, supplierId, bidValue } = await req.json();

    if (!itemId || !supplierId || !bidValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { auction: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const auction = item.auction;
    if (!auction || auction.status !== "LIVE") {
      return NextResponse.json({ error: "Auction not live" }, { status: 400 });
    }

    // Fetch current lowest bid for this item
    const lowestBid = await prisma.bid.findFirst({
      where: { itemId },
      orderBy: { bidValue: "asc" },
    });

    // Check decrement step rule
    if (lowestBid && bidValue >= lowestBid.bidValue) {
      return NextResponse.json(
        { error: "Bid must be lower than current lowest bid" },
        { status: 400 }
      );
    }

    if (
      lowestBid &&
      (lowestBid.bidValue - bidValue) % auction.decrementStep !== 0
    ) {
      return NextResponse.json(
        {
          error: `Bid decrement must be in multiples of ${auction.decrementStep}`,
        },
        { status: 400 }
      );
    }

    // Save bid
    const newBid = await prisma.bid.create({
      data: {
        itemId,
        supplierId,
        bidValue: Number(bidValue),
      },
    });

    // Notify all clients via SSE
    broadcastBidUpdate(auction.id);

    return NextResponse.json({
      message: "Bid submitted successfully",
      bid: newBid,
    });
  } catch (err) {
    console.error("Bid submission error:", err);
    return NextResponse.json({ error: "Failed to submit bid" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const bids = await prisma.bid.findMany({
      include: {
        supplier: { select: { username: true } },
        item: { select: { description: true } },
      },
      orderBy: { bidValue: "asc" },
    });

    return NextResponse.json(bids);
  } catch (err) {
    console.error("Error fetching bids:", err);
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
  }
}

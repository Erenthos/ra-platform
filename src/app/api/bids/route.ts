import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { broadcastBidUpdate } from "../sse/route";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { itemId, supplierId, bidValue } = await req.json();
    if (!itemId || !supplierId || !bidValue)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { auction: true },
    });

    if (!item || item.auction.status !== "LIVE")
      return NextResponse.json({ error: "Auction not live" }, { status: 400 });

    await prisma.bid.create({
      data: {
        itemId,
        supplierId,
        bidValue: Number(bidValue),
      },
    });

    // Notify all dashboards
    broadcastBidUpdate(item.auctionId);

    return NextResponse.json({ message: "Bid submitted successfully" });
  } catch (err) {
    console.error("Bid error:", err);
    return NextResponse.json({ error: "Failed to submit bid" }, { status: 500 });
  }
}

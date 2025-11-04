// --- Force this endpoint to run only at runtime on Node.js ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // ✅ Lazy import to avoid build-time execution of Prisma
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const body: {
      itemId: number;
      supplierId: number;
      bidValue: number;
    } = await request.json();

    const { itemId, supplierId, bidValue } = body;

    if (!itemId || !supplierId || !bidValue) {
      return NextResponse.json(
        { error: "Missing required bid fields" },
        { status: 400 }
      );
    }

    // Get auction and validate minimum decrement step
    const auction = await prisma.auction.findFirst({
      where: { items: { some: { id: itemId } } },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found for this item" },
        { status: 404 }
      );
    }

    const lastBid = await prisma.bid.findFirst({
      where: { itemId },
      orderBy: { bidValue: "asc" },
    });

    const minAllowedBid =
      (lastBid ? Number(lastBid.bidValue) : Number(auction.startPrice)) -
      Number(auction.decrementStep);

    if (Number(bidValue) > minAllowedBid) {
      return NextResponse.json(
        {
          error: `Bid must be ≤ ${minAllowedBid.toFixed(2)} as per decrement step`,
        },
        { status: 400 }
      );
    }

    const newBid = await prisma.bid.create({
      data: {
        itemId,
        supplierId,
        bidValue: Number(bidValue),
      },
    });

    return NextResponse.json(newBid);
  } catch (error: any) {
    console.error("Error submitting bid:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

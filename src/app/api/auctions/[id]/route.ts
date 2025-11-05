import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auctions/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auctionId = parseInt(params.id);

    // Get auction, items, and bids with min values per item
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        items: {
          include: {
            bids: {
              orderBy: { bidValue: "asc" },
              take: 1,
            },
          },
        },
        bids: true,
      },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    // Compute current minimum for each item
    const itemsWithMin = auction.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      uom: item.uom,
      currentMin: item.bids.length > 0 ? item.bids[0].bidValue : null,
    }));

    return NextResponse.json({
      id: auction.id,
      title: auction.title,
      status: auction.status,
      decrementStep: auction.decrementStep,
      durationMins: auction.durationMins,
      startPrice: auction.startPrice,
      items: itemsWithMin,
    });
  } catch (error) {
    console.error("Error fetching auction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

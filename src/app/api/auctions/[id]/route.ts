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

    // Get auction, items, and bids for each item
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        items: {
          include: {
            bids: {
              orderBy: { bidValue: "asc" },
            },
          },
        },
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
      currentMin:
        item.bids && item.bids.length > 0
          ? Math.min(...item.bids.map((b) => b.bidValue))
          : null,
    }));

    // Prepare final response
    const responseData = {
      id: auction.id,
      title: auction.title,
      status: auction.status,
      decrementStep: auction.decrementStep,
      durationMins: auction.durationMins,
      startPrice: auction.startPrice,
      items: itemsWithMin,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching auction details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

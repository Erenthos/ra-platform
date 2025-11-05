import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auctions/[id]/close
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auctionId = parseInt(params.id);
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status !== "LIVE") {
      return NextResponse.json(
        { error: "Only live auctions can be closed" },
        { status: 400 }
      );
    }

    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: "CLOSED",
        endTime: new Date(),
      },
    });

    return NextResponse.json({
      message: `Auction #${auctionId} closed successfully.`,
    });
  } catch (error) {
    console.error("Error closing auction:", error);
    return NextResponse.json({ error: "Failed to close auction" }, { status: 500 });
  }
}

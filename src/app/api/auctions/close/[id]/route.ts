import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auctionId = parseInt(params.id);
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status === "CLOSED") {
      return NextResponse.json({ message: "Auction already closed" });
    }

    // ✅ Close auction
    const updated = await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: "CLOSED",
        endTime: new Date(),
      },
    });

    return NextResponse.json({ message: "Auction closed", auction: updated });
  } catch (error) {
    console.error("Error closing auction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auctionId = parseInt(params.id);
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status === "LIVE") {
      return NextResponse.json({ message: "Auction already LIVE" });
    }

    // Compute start & end times
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + auction.durationMins * 60 * 1000);

    const updated = await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: "LIVE",
        startTime,
        endTime,
      },
    });

    return NextResponse.json({ message: "Auction started", auction: updated });
  } catch (error) {
    console.error("Error starting auction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

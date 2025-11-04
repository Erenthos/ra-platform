import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auctionId = Number(params.id);
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status === "LIVE") {
      return NextResponse.json({ error: "Auction is already live" }, { status: 400 });
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + auction.durationMins * 60 * 1000);

    const updated = await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: "LIVE",
        startTime: now,
        endTime,
      },
    });

    return NextResponse.json({
      message: "Auction started successfully",
      auction: updated,
    });
  } catch (error: any) {
    console.error("Error starting auction:", error);
    return NextResponse.json(
      { error: "Server error starting auction" },
      { status: 500 }
    );
  }
}

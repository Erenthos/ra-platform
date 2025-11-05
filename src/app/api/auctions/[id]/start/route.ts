import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/auctions/[id]/start
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

    if (auction.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Auction already started or closed" },
        { status: 400 }
      );
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + auction.durationMins * 60000);

    // Update auction as LIVE
    await prisma.auction.update({
      where: { id: auctionId },
      data: { status: "LIVE", startTime, endTime },
    });

    // Schedule automatic closure
    setTimeout(async () => {
      try {
        const current = await prisma.auction.findUnique({ where: { id: auctionId } });
        if (current && current.status === "LIVE") {
          await prisma.auction.update({
            where: { id: auctionId },
            data: { status: "CLOSED", endTime: new Date() },
          });
          console.log(`⏱️ Auction #${auctionId} auto-closed after duration.`);
        }
      } catch (e) {
        console.error("Auto-close error:", e);
      }
    }, auction.durationMins * 60000);

    return NextResponse.json({
      message: `Auction #${auctionId} started successfully`,
    });
  } catch (error) {
    console.error("Error starting auction:", error);
    return NextResponse.json({ error: "Failed to start auction" }, { status: 500 });
  }
}

// --- Node-only runtime (no pre-rendering) ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const auctionId = Number(params.id);
    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (auction.status === "CLOSED") {
      return NextResponse.json({ error: "Auction already closed" }, { status: 400 });
    }

    const updated = await prisma.auction.update({
      where: { id: auctionId },
      data: { status: "CLOSED", endTime: new Date() },
    });

    return NextResponse.json({
      message: "Auction closed successfully",
      auction: updated,
    });
  } catch (error: any) {
    console.error("Error closing auction:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

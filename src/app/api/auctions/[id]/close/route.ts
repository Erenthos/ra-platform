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
    return NextResponse.json(
      { error: "Server error closing auction" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        items: {
          include: {
            bids: {
              include: {
                supplier: { select: { id: true, username: true } },
              },
              orderBy: { bidValue: "asc" }, // lowest first
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(auctions);
  } catch (err) {
    console.error("❌ Error fetching auctions:", err);
    return NextResponse.json({ error: "Failed to fetch auctions" }, { status: 500 });
  }
}

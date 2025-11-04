// --- Node-only runtime (no pre-rendering) ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

// GET all auctions with lowest bids
export async function GET() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const auctions = await prisma.auction.findMany({
      orderBy: { id: "desc" },
      include: {
        items: {
          include: {
            bids: { orderBy: { bidValue: "asc" }, take: 1 },
          },
        },
      },
    });

    const result = auctions.map((a) => ({
      ...a,
      items: a.items.map((it) => ({
        ...it,
        currentMin: it.bids?.[0]?.bidValue ?? null,
      })),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching auctions:", error);
    return NextResponse.json({ error: "Failed to fetch auctions" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST create auction
export async function POST(request: NextRequest) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const body = await request.json();
    const { title, startPrice, decrementStep, durationMins, itemsText } = body;

    const auction = await prisma.auction.create({
      data: {
        title,
        startPrice: Number(startPrice),
        decrementStep: Number(decrementStep),
        durationMins: Number(durationMins),
        status: "SCHEDULED",
      },
    });

    const lines = (itemsText || "")
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    for (const ln of lines) {
      const [desc, qty, uom] = ln.split(",").map((x) => x.trim());
      if (desc) {
        await prisma.item.create({
          data: {
            auctionId: auction.id,
            description: desc,
            quantity: Number(qty) || 1,
            uom: uom || "NOS",
          },
        });
      }
    }

    return NextResponse.json(auction);
  } catch (error: any) {
    console.error("Error creating auction:", error);
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

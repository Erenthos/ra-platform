// --- Node-only runtime ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const auctions = await prisma.auction.findMany({
      include: {
        items: {
          include: {
            bids: { orderBy: { bidValue: "asc" }, take: 1 },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(auctions);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return NextResponse.json(
      { error: "Error fetching auctions" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const body = await request.json();
    const {
      title,
      startPrice,
      decrementStep,
      durationMins,
      buyerId,
      itemsText,
    } = body;

    if (!buyerId) {
      return NextResponse.json(
        { error: "Missing buyerId — required to create auction." },
        { status: 400 }
      );
    }

    // ✅ Proper Prisma relation creation
    const auction = await prisma.auction.create({
      data: {
        title: title || "Untitled Auction",
        startPrice: Number(startPrice),
        decrementStep: Number(decrementStep),
        durationMins: Number(durationMins) || 10,
        status: "SCHEDULED",
        buyer: {
          connect: {
            id: Number(buyerId), // 👈 this is the key fix
          },
        },
      },
    });

    // ✅ Add items
    const lines = (itemsText || "")
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    for (const ln of lines) {
      const [description, qty, uom] = ln.split(",").map((p) => p.trim());
      await prisma.item.create({
        data: {
          auctionId: auction.id,
          description,
          quantity: Number(qty) || 1,
          uom: uom || "NOS",
        },
      });
    }

    return NextResponse.json({
      message: "Auction created successfully",
      auctionId: auction.id,
    });
  } catch (error) {
    console.error("Error creating auction:", error);
    return NextResponse.json(
      { error: "Error creating auction" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

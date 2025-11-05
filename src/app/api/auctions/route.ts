import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — Fetch all auctions with items + bids
export async function GET(req: NextRequest) {
  try {
    const auctions = await prisma.auction.findMany({
      orderBy: { id: "desc" },
      include: {
        items: {
          include: {
            bids: true, // ✅ include bids inside each item
          },
        },
      },
    });

    // Flatten bids for easier display on buyer dashboard
    const result = auctions.map((auction) => ({
      ...auction,
      bids: auction.items.flatMap((item) =>
        item.bids.map((b) => ({
          id: b.id,
          supplierId: b.supplierId,
          itemId: item.id,
          bidValue: b.bidValue,
        }))
      ),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return NextResponse.json(
      { error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}

// POST — Create new auction
export async function POST(req: NextRequest) {
  try {
    const { title, startPrice, decrementStep, durationMins, itemsText } =
      await req.json();

    if (!title || !startPrice || !itemsText) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For now, assume a single buyer (extend later with auth)
    const buyerId = 1;

    // Create auction
    const auction = await prisma.auction.create({
      data: {
        title,
        startPrice: parseFloat(startPrice),
        decrementStep: parseFloat(decrementStep),
        durationMins: parseInt(durationMins),
        status: "SCHEDULED",
        buyerId,
      },
    });

    // Parse items from text (e.g. "Cable, 100, M")
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
          quantity: parseFloat(qty || "1"),
          uom: uom || "NOS",
        },
      });
    }

    return NextResponse.json({ message: "Auction created", auction });
  } catch (error) {
    console.error("Error creating auction:", error);
    return NextResponse.json(
      { error: "Failed to create auction" },
      { status: 500 }
    );
  }
}

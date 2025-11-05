import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

// 📥 GET: Fetch all auctions with their items and bids
export async function GET() {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        buyer: { select: { id: true, username: true } },
        items: {
          include: {
            bids: {
              include: { supplier: { select: { id: true, username: true } } },
              orderBy: { bidValue: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(auctions);
  } catch (err) {
    console.error("❌ Error fetching auctions:", err);
    return NextResponse.json(
      { error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}

// 🛠️ POST: Create new auction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, startPrice, decrementStep, durationMins, itemsText, buyerId } = body;

    if (!buyerId) {
      return NextResponse.json(
        { error: "Missing buyerId (please sign in again)" },
        { status: 400 }
      );
    }

    if (!title || !startPrice || !durationMins || !itemsText) {
      return NextResponse.json(
        { error: "Missing required auction details" },
        { status: 400 }
      );
    }

    // ✅ Create auction linked to the logged-in buyer
    const auction = await prisma.auction.create({
      data: {
        title,
        startPrice: Number(startPrice),
        decrementStep: Number(decrementStep) || 1,
        durationMins: Number(durationMins),
        status: "SCHEDULED",
        buyer: { connect: { id: Number(buyerId) } },
      },
    });

    // ✅ Add items to auction
    const lines = (itemsText || "")
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean);

    for (const ln of lines) {
      const parts = ln.split(",").map((p) => p.trim());
      const [description, quantity, uom] = parts;
      if (!description || !quantity || !uom) continue;

      await prisma.item.create({
        data: {
          auctionId: auction.id,
          description,
          quantity: Number(quantity),
          uom,
        },
      });
    }

    return NextResponse.json({ message: "Auction created successfully", auction });
  } catch (err) {
    console.error("🚨 Error creating auction:", err);
    return NextResponse.json({ error: "Error creating auction" }, { status: 500 });
  }
}

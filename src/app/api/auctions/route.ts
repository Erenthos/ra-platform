import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ GET — Fetch all auctions (with items, bids, and supplier info)
export async function GET(req: NextRequest) {
  try {
    const auctions = await prisma.auction.findMany({
      orderBy: { id: "desc" },
      include: {
        items: {
          include: {
            bids: {
              include: {
                supplier: true, // ✅ Add supplier info (username, id)
              },
              orderBy: { bidValue: "asc" },
            },
          },
        },
      },
    });

    // ✅ Structure data for dashboard display
    const result = auctions.map((auction) => ({
      id: auction.id,
      title: auction.title,
      status: auction.status,
      decrementStep: auction.decrementStep,
      durationMins: auction.durationMins,
      startPrice: auction.startPrice,
      createdAt: auction.createdAt,
      items: auction.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        uom: item.uom,
        bids: item.bids.map((bid) => ({
          id: bid.id,
          supplierId: bid.supplierId,
          supplierName: bid.supplier?.username || `Supplier #${bid.supplierId}`,
          bidValue: bid.bidValue,
        })),
      })),
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

// ✅ POST — Create new auction (unchanged)
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

    // Assuming buyer is logged in (placeholder ID)
    const buyerId = 1;

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

    // Parse items (CSV lines: "Description, Qty, UOM")
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

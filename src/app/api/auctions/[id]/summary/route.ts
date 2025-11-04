import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ------------------------------------
// GET: Fetch auctions (optionally only live ones)
// ------------------------------------
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const live = url.searchParams.get("live");

  if (live) {
    const auctions = await prisma.auction.findMany({
      where: { status: "LIVE" },
      include: { items: true },
    });

    // Compute current minimum bid for each item
    for (const a of auctions) {
      for (const it of a.items) {
        const minBid = await prisma.bid.findFirst({
          where: { itemId: it.id },
          orderBy: { bidValue: "asc" },
        });
        (it as any).currentMin = minBid ? minBid.bidValue : a.startPrice;
      }
    }

    return NextResponse.json(auctions);
  }

  const all = await prisma.auction.findMany({
    orderBy: { id: "desc" },
  });
  return NextResponse.json(all);
}

// ------------------------------------
// POST: Create a new auction
// ------------------------------------
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, decrementStep, durationMins, startPrice, itemsText } = body;

  // Temporary buyerId = 1 (replace with authenticated buyer later)
  const auction = await prisma.auction.create({
    data: {
      buyerId: 1,
      title,
      decrementStep: Number(decrementStep),
      durationMins: Number(durationMins),
      startPrice: Number(startPrice),
    },
    include: { items: true },
  });

  // ✅ Explicit typing for all lambda parameters
  const lines = (itemsText ?? "")
    .split("\n")
    .map((l: string) => l.trim())
    .filter((line: string): line is string => Boolean(line));

  for (const ln of lines) {
    const parts = ln.split(",").map((p: string) => p.trim());
    await prisma.item.create({
      data: {
        auctionId: auction.id,
        description: parts[0],
        quantity: Number(parts[1] || 1),
        uom: parts[2] || "NOS",
      },
    });
  }

  const withItems = await prisma.auction.findUnique({
    where: { id: auction.id },
    include: { items: true },
  });

  return NextResponse.json(withItems);
}

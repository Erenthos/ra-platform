// --- Make this endpoint Node-only and never pre-rendered ---
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // lazy import so build never loads Prisma during static analysis
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const url = new URL(request.url);
  const live = url.searchParams.get("live");

  if (live) {
    const auctions = await prisma.auction.findMany({
      where: { status: "LIVE" },
      include: { items: true },
    });

    // compute current minimum bid for each item
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

  const all = await prisma.auction.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const body: {
    title: string;
    decrementStep: number;
    durationMins: number;
    startPrice: number;
    itemsText?: string;
  } = await request.json();

  const { title, decrementStep, durationMins, startPrice, itemsText } = body;

  const auction = await prisma.auction.create({
    data: {
      buyerId: 1, // replace with real authenticated buyer
      title,
      decrementStep: Number(decrementStep),
      durationMins: Number(durationMins),
      startPrice: Number(startPrice),
    },
    include: { items: true },
  });

  const lines: string[] = (itemsText ?? "")
    .split("\n")
    .map((l: string) => l.trim())
    .filter((line: string): boolean => line.length > 0);

  for (const ln of lines) {
    const parts: string[] = ln.split(",").map((p: string) => p.trim());
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

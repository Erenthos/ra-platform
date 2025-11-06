import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auctionId = Number(params.id);

  try {
    // ✅ Lazy import of xlsx (no heavy bundling)
    const XLSX = await import("xlsx");

    // ✅ Fetch auction with related data
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        buyer: { select: { username: true } },
        items: {
          include: {
            bids: {
              include: { supplier: { select: { username: true } } },
              orderBy: { bidValue: "asc" },
            },
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    // ✅ Prepare worksheet data
    const sheetData: any[][] = [];

    // Header
    sheetData.push(["Reverse Auction Summary Report"]);
    sheetData.push([]);
    sheetData.push(["Auction Title:", auction.title]);
    sheetData.push(["Buyer:", auction.buyer?.username || ""]);
    sheetData.push(["Status:", auction.status]);
    sheetData.push(["Start Price:", `₹${auction.startPrice}`]);
    sheetData.push(["Duration:", `${auction.durationMins} minutes`]);
    sheetData.push([]);

    // Table header
    sheetData.push([
      "Item Description",
      "Quantity",
      "UOM",
      "Supplier",
      "Bid Value",
      "Winner",
    ]);

    // Table rows
    for (const item of auction.items) {
      if (item.bids.length === 0) {
        sheetData.push([
          item.description,
          item.quantity,
          item.uom,
          "No bids",
          "-",
          "",
        ]);
      } else {
        item.bids.forEach((bid, i) => {
          const isWinner = i === 0;
          sheetData.push([
            i === 0 ? item.description : "",
            i === 0 ? item.quantity : "",
            i === 0 ? item.uom : "",
            bid.supplier.username,
            bid.bidValue,
            isWinner ? "🏆 Winner" : "",
          ]);
        });
      }
    }

    sheetData.push([]);
    sheetData.push(["Generated On:", new Date().toLocaleString()]);
    sheetData.push(["© Reverse Auction Platform"]);

    // ✅ Create worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auction Summary");

    // ✅ Convert to binary buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // ✅ Return file
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Auction_${auctionId}_Summary.xlsx"`,
      },
    });
  } catch (err) {
    console.error("🚨 Error generating Excel summary:", err);
    return NextResponse.json(
      { error: "Failed to generate Excel summary" },
      { status: 500 }
    );
  }
}

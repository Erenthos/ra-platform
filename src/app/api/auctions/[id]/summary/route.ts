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
    // ✅ Lazy import exceljs only at runtime (avoids build-time bundling)
    const ExcelJS = (await import("exceljs")).default;

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

    // ✅ Create workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Auction Summary");

    sheet.mergeCells("A1", "F1");
    sheet.getCell("A1").value = "Reverse Auction Summary Report";
    sheet.getCell("A1").font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getCell("A1").alignment = { horizontal: "center" };
    sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };

    sheet.addRow([]);
    sheet.addRow(["Auction Title:", auction.title]);
    sheet.addRow(["Buyer:", auction.buyer?.username]);
    sheet.addRow(["Status:", auction.status]);
    sheet.addRow(["Start Price:", `₹${auction.startPrice}`]);
    sheet.addRow(["Duration:", `${auction.durationMins} minutes`]);
    sheet.addRow([]);

    sheet.addRow(["Item Description", "Qty", "UOM", "Supplier", "Bid Value", "Winner"]);
    const headerRow = sheet.lastRow!;
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    auction.items.forEach((item) => {
      if (item.bids.length === 0) {
        sheet.addRow([item.description, item.quantity, item.uom, "No bids", "-", ""]);
      } else {
        item.bids.forEach((bid, i) => {
          const isWinner = i === 0;
          const row = sheet.addRow([
            i === 0 ? item.description : "",
            i === 0 ? item.quantity : "",
            i === 0 ? item.uom : "",
            bid.supplier.username,
            bid.bidValue,
            isWinner ? "🏆 Winner" : "",
          ]);
          if (isWinner) row.getCell(6).font = { color: { argb: "FF007000" }, bold: true };
        });
      }
    });

    sheet.columns = [
      { width: 30 },
      { width: 10 },
      { width: 10 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
    ];

    sheet.addRow([]);
    sheet.addRow(["Generated On:", new Date().toLocaleString()]);
    sheet.addRow(["© Reverse Auction Platform"]);

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
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

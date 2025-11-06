import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

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
    // ✅ Fetch auction with buyer, items, and bids
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

    // ✅ Create workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Auction Summary");

    // --- Header ---
    sheet.mergeCells("A1", "E1");
    const headerCell = sheet.getCell("A1");
    headerCell.value = "Reverse Auction Summary Report";
    headerCell.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    headerCell.alignment = { horizontal: "center" };
    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } };

    // --- Auction Metadata ---
    sheet.addRow([]);
    sheet.addRow(["Auction Title:", auction.title]);
    sheet.addRow(["Buyer:", auction.buyer?.username]);
    sheet.addRow(["Status:", auction.status]);
    sheet.addRow(["Start Price:", `₹${auction.startPrice}`]);
    sheet.addRow(["Duration:", `${auction.durationMins} minutes`]);
    sheet.addRow([]);

    // --- Table Header ---
    sheet.addRow(["Item Description", "Quantity", "UOM", "Supplier", "Bid Value", "Winner"]);
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

    // --- Table Content ---
    auction.items.forEach((item) => {
      const bids = item.bids;
      if (bids.length === 0) {
        sheet.addRow([item.description, item.quantity, item.uom, "No bids", "-", ""]);
      } else {
        bids.forEach((bid, i) => {
          const isWinner = i === 0; // first = lowest
          const row = sheet.addRow([
            i === 0 ? item.description : "",
            i === 0 ? item.quantity : "",
            i === 0 ? item.uom : "",
            bid.supplier.username,
            bid.bidValue,
            isWinner ? "🏆 Winner" : "",
          ]);
          if (isWinner) {
            row.getCell(6).font = { color: { argb: "FF007000" }, bold: true };
          }
        });
      }
    });

    // --- Format Columns ---
    sheet.columns = [
      { key: "desc", width: 35 },
      { key: "qty", width: 10 },
      { key: "uom", width: 10 },
      { key: "supplier", width: 25 },
      { key: "bid", width: 15 },
      { key: "winner", width: 15 },
    ];

    // --- Footer ---
    const footerRow = sheet.addRow([]);
    sheet.addRow(["Generated On:", new Date().toLocaleString()]);
    sheet.addRow(["© Reverse Auction Platform", ""]);

    // --- Finalize and send ---
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

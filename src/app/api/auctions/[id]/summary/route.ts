import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

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
    // ✅ Fetch auction + buyer + items + bids
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

    // ✅ Generate PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    const chunks: Uint8Array[] = [];
    const stream = new Readable({
      read() {},
    });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => stream.push(null));

    // --- Header ---
    doc.fontSize(20).text("Reverse Auction Summary Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Auction Title: ${auction.title}`);
    doc.text(`Buyer: ${auction.buyer?.username || ""}`);
    doc.text(`Status: ${auction.status}`);
    doc.text(`Start Price: ₹${auction.startPrice}`);
    doc.text(`Duration: ${auction.durationMins} minutes`);
    doc.moveDown();

    // --- Table Header ---
    doc
      .font("Helvetica-Bold")
      .text("Item Description", 50, doc.y)
      .text("Qty", 250, doc.y)
      .text("UOM", 300, doc.y)
      .text("Supplier", 370, doc.y)
      .text("Bid Value", 470, doc.y)
      .text("Winner", 550, doc.y);
    doc.moveDown();
    doc.font("Helvetica");

    // --- Table Rows ---
    auction.items.forEach((item) => {
      if (item.bids.length === 0) {
        doc.text(item.description, 50);
        doc.text(String(item.quantity), 250);
        doc.text(item.uom || "NOS", 300);
        doc.text("No bids", 370);
        doc.moveDown();
      } else {
        item.bids.forEach((bid, idx) => {
          const isWinner = idx === 0;
          doc.text(idx === 0 ? item.description : "", 50);
          doc.text(idx === 0 ? String(item.quantity) : "", 250);
          doc.text(idx === 0 ? item.uom || "NOS" : "", 300);
          doc.text(bid.supplier.username, 370);
          doc.text(`₹${bid.bidValue.toFixed(2)}`, 470);
          doc.text(isWinner ? "🏆 Winner" : "", 550);
          doc.moveDown(0.5);
        });
        doc.moveDown();
      }
    });

    doc.moveDown(2);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown(0.5);
    doc.fontSize(10).text("© 2025 Reverse Auction Platform", { align: "center" });

    doc.end();

    // ✅ Convert to ArrayBuffer
    const pdfBuffer = Buffer.concat(chunks);
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    );

    // ✅ Return as file
    return new NextResponse(arrayBuffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Auction_${auctionId}_Summary.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ Error generating PDF summary:", error);
    return NextResponse.json(
      { error: "Error generating PDF" },
      { status: 500 }
    );
  }
}

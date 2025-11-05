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
    // ✅ Fetch auction data including items and bids
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        buyer: { select: { username: true } },
        items: {
          include: {
            bids: {
              include: {
                supplier: { select: { username: true } },
              },
              orderBy: { bidValue: "asc" },
            },
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { error: "Auction not found" },
        { status: 404 }
      );
    }

    // ✅ Create the PDF
    const doc = new PDFDocument({ margin: 40 });
    const buffers: Uint8Array[] = [];

    doc.on("data", buffers.push.bind(buffers));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    // ✅ Header
    doc
      .fontSize(20)
      .fillColor("#1e3a8a")
      .text("Reverse Auction Summary Report", { align: "center" })
      .moveDown();

    doc
      .fontSize(12)
      .fillColor("black")
      .text(`Auction Title: ${auction.title}`)
      .text(`Buyer: ${auction.buyer?.username}`)
      .text(`Status: ${auction.status}`)
      .text(`Start Price: ₹${auction.startPrice}`)
      .text(`Duration: ${auction.durationMins} mins`)
      .moveDown();

    // ✅ Items table
    doc.fontSize(14).fillColor("#1e3a8a").text("Items and Bids", { underline: true }).moveDown(0.5);
    doc.fontSize(11).fillColor("black");

    auction.items.forEach((item) => {
      doc.text(`• ${item.description} (${item.quantity} ${item.uom})`);
      if (item.bids.length === 0) {
        doc.text("   No bids submitted yet.").moveDown(0.5);
      } else {
        item.bids.forEach((bid, index) => {
          const isLowest = index === 0;
          const bidText = `   ${bid.supplier.username}: ₹${bid.bidValue}`;
          doc.text(isLowest ? bidText + " ✅ (Lowest)" : bidText);
        });
        doc.moveDown(0.5);
      }
    });

    // ✅ Determine winners
    doc.moveDown(1);
    doc.fontSize(14).fillColor("#1e3a8a").text("Winner Summary", { underline: true }).moveDown(0.5);
    auction.items.forEach((item) => {
      const winner = item.bids[0];
      if (winner) {
        doc
          .fontSize(11)
          .fillColor("black")
          .text(`${item.description} → Winner: ${winner.supplier.username} @ ₹${winner.bidValue}`);
      }
    });

    doc.end();
    const pdfBuffer = await done;

    // ✅ Convert to ArrayBuffer for NextResponse
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    );

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Auction_${auctionId}_Summary.pdf"`,
      },
    });
  } catch (err) {
    console.error("🚨 Error generating auction PDF:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auctionId = parseInt(params.id);
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        items: {
          include: {
            bids: {
              include: { supplier: true },
              orderBy: { bidValue: "asc" },
            },
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // Header
    doc.fontSize(20).text("Reverse Auction Summary Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Auction ID: ${auction.id}`);
    doc.text(`Title: ${auction.title}`);
    doc.text(`Status: ${auction.status}`);
    doc.text(`Duration: ${auction.durationMins} mins`);
    doc.text(`Decrement Step: ₹${auction.decrementStep}`);
    doc.text(`Start Price: ₹${auction.startPrice}`);
    doc.moveDown();

    // Table Header
    doc.fontSize(14).text("Item-wise Bid Summary", { underline: true });
    doc.moveDown(0.5);

    auction.items.forEach((item, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${item.description}`);
      doc.text(`Qty: ${item.quantity} ${item.uom}`);
      if (item.bids.length === 0) {
        doc.fillColor("gray").text("No bids received yet.");
        doc.moveDown(1);
        doc.fillColor("black");
        return;
      }

      const winner = item.bids[0];
      doc.moveDown(0.5);
      doc.fontSize(11).text("Bids:", { underline: true });
      doc.moveDown(0.3);

      item.bids.forEach((b) => {
        const isWinner = b.id === winner.id;
        if (isWinner) doc.fillColor("green");
        doc.text(
          `${b.supplier?.username || "Supplier #"+b.supplierId} — ₹${b.bidValue}` +
            (isWinner ? " (L1 Winner)" : "")
        );
        doc.fillColor("black");
      });

      doc.moveDown(1);
    });

    doc.end();
    const buffer = await done;
    const arrayBuffer = Uint8Array.from(buffer).buffer;

    return new NextResponse(arrayBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Auction_${auctionId}_Summary.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

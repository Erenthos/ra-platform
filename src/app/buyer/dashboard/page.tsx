"use client";
import { useEffect, useState } from "react";

interface Bid {
  id: number;
  supplierId: number;
  supplierName: string;
  bidValue: number;
}

interface Item {
  id: number;
  description: string;
  quantity: number;
  uom: string;
  bids: Bid[];
}

interface Auction {
  id: number;
  title: string;
  status: string;
  decrementStep: number;
  durationMins: number;
  startPrice: number;
  items: Item[];
}

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auctions", { cache: "no-store" });
      const data = await res.json();
      setAuctions(data);
    } catch (err) {
      console.error("Error fetching auctions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const startAuction = async (auctionId: number) => {
    try {
      await fetch(`/api/auctions/${auctionId}/start`, { method: "POST" });
      alert("Auction started successfully!");
      fetchAuctions();
    } catch (e) {
      alert("Failed to start auction");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-10">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        🏦 Buyer Dashboard
      </h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading auctions...</p>
      ) : auctions.length === 0 ? (
        <p className="text-center text-gray-500">No auctions found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              className="bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition p-6"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  {auction.title}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    auction.status === "LIVE"
                      ? "bg-green-100 text-green-700"
                      : auction.status === "CLOSED"
                      ? "bg-gray-200 text-gray-600"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {auction.status}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-3">
                Duration: {auction.durationMins} mins | Step: ₹
                {auction.decrementStep}
              </p>

              {auction.status === "SCHEDULED" && (
                <button
                  onClick={() => startAuction(auction.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Start Auction
                </button>
              )}

              <button
                className="mt-4 text-indigo-600 hover:underline text-sm"
                onClick={() =>
                  setExpandedId(expandedId === auction.id ? null : auction.id)
                }
              >
                {expandedId === auction.id
                  ? "Hide Current Bids"
                  : "View Current Bids"}
              </button>

              {expandedId === auction.id && (
                <div className="mt-4 overflow-x-auto">
                  {auction.items.length === 0 ? (
                    <p className="text-gray-500 text-sm">No items added yet</p>
                  ) : (
                    <table className="min-w-full border border-gray-200 text-sm">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="p-2 border">Item Description</th>
                          <th className="p-2 border">Qty</th>
                          <th className="p-2 border">UOM</th>
                          <th className="p-2 border">Supplier</th>
                          <th className="p-2 border">Bid (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auction.items.flatMap((item) =>
                          item.bids.length > 0 ? (
                            item.bids.map((bid) => (
                              <tr key={bid.id} className="text-gray-700">
                                <td className="p-2 border">
                                  {item.description}
                                </td>
                                <td className="p-2 border text-center">
                                  {item.quantity}
                                </td>
                                <td className="p-2 border text-center">
                                  {item.uom}
                                </td>
                                <td className="p-2 border text-center">
                                  {bid.supplierName}
                                </td>
                                <td className="p-2 border text-center font-medium">
                                  ₹{bid.bidValue}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr key={item.id}>
                              <td className="p-2 border">{item.description}</td>
                              <td className="p-2 border text-center">
                                {item.quantity}
                              </td>
                              <td className="p-2 border text-center">
                                {item.uom}
                              </td>
                              <td
                                className="p-2 border text-center text-gray-400"
                                colSpan={2}
                              >
                                No bids yet
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

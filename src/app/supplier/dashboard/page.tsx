"use client";

import { useEffect, useState } from "react";

interface Bid {
  id: number;
  supplierId: number;
  bidValue: number;
}

interface Item {
  id: number;
  description: string;
  quantity: number;
  uom: string;
  bids: Bid[];
  currentMin: number;
}

interface Auction {
  id: number;
  title: string;
  status: string;
  items: Item[];
}

export default function SupplierDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);

  // Fetch all live auctions
  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auctions", { cache: "no-store" });
      const data = await res.json();
      // Only live auctions
      const liveAuctions = data.filter((a: any) => a.status === "LIVE");
      // Compute current minimum per item
      liveAuctions.forEach((a: any) => {
        a.items.forEach((i: any) => {
          i.currentMin =
            i.bids?.length > 0
              ? Math.min(...i.bids.map((b: any) => b.bidValue))
              : null;
        });
      });
      setAuctions(liveAuctions);
    } catch (err) {
      console.error("Error fetching auctions:", err);
    } finally {
      setLoading(false);
    }
  };

  // SSE subscription for real-time updates
  useEffect(() => {
    fetchAuctions();

    const events = new EventSource("/api/sse");
    events.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "bid_update") {
          console.log("♻️ Bid update received — refreshing supplier view...");
          fetchAuctions();
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };
    return () => events.close();
  }, []);

  const handleBidChange = (itemId: number, value: string) => {
    setBids((prev) => ({ ...prev, [itemId]: value }));
  };

  // Submit all entered bids for selected auction
  const submitBids = async () => {
    if (!selectedAuction) return alert("No auction selected");

    const supplierId = Number(localStorage.getItem("supplierId")); // assume supplier login stored id

    const promises = Object.entries(bids).map(([itemId, bidValue]) =>
      fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: Number(itemId),
          supplierId,
          bidValue: Number(bidValue),
        }),
      })
    );

    try {
      await Promise.all(promises);
      alert("✅ Bids submitted successfully!");
      setBids({});
      fetchAuctions();
    } catch (err) {
      alert("❌ Failed to submit bids");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        🧑‍🔧 Supplier Dashboard
      </h1>

      {/* ==== Auction List ==== */}
      {!selectedAuction ? (
        <>
          {loading ? (
            <p className="text-center text-gray-600">Loading live auctions...</p>
          ) : auctions.length === 0 ? (
            <p className="text-center text-gray-500">
              No live auctions available.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {auctions.map((auction) => (
                <div
                  key={auction.id}
                  className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    {auction.title}
                  </h2>
                  <p className="text-sm text-gray-500 mb-2">
                    Items: {auction.items.length}
                  </p>
                  <button
                    onClick={() => setSelectedAuction(auction)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    💰 View & Bid
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* ==== Auction Details + Bidding Form ==== */}
          <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {selectedAuction.title}
                </h2>
                <p className="text-sm text-gray-600">
                  Status:{" "}
                  <span className="font-medium text-green-600">
                    {selectedAuction.status}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedAuction(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Auctions
              </button>
            </div>

            {/* ==== Items Table ==== */}
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Qty</th>
                  <th className="p-2 border">UOM</th>
                  <th className="p-2 border">Current Minimum (₹)</th>
                  <th className="p-2 border">Your Bid (₹)</th>
                </tr>
              </thead>
              <tbody>
                {selectedAuction.items.map((item) => (
                  <tr key={item.id} className="text-gray-700">
                    <td className="p-2 border">{item.description}</td>
                    <td className="p-2 border text-center">{item.quantity}</td>
                    <td className="p-2 border text-center">{item.uom}</td>
                    <td
                      className={`p-2 border text-center ${
                        item.currentMin ? "text-green-700" : "text-gray-400"
                      }`}
                    >
                      {item.currentMin ? `₹${item.currentMin}` : "—"}
                    </td>
                    <td className="p-2 border text-center">
                      <input
                        type="number"
                        className="w-24 border rounded-md p-1 text-center"
                        value={bids[item.id] || ""}
                        onChange={(e) =>
                          handleBidChange(item.id, e.target.value)
                        }
                        placeholder="Enter"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ==== Submit Bids ==== */}
            <div className="flex justify-end mt-4">
              <button
                onClick={submitBids}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
              >
                🚀 Submit All Bids
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

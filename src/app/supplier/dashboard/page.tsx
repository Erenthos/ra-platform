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
  currentMin: number | null;
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
  const [message, setMessage] = useState<string | null>(null);

  // 🔄 Fetch auctions (with bids + current minimum)
  const fetchAuctions = async () => {
    try {
      const res = await fetch("/api/auctions", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch auctions");
      const data = await res.json();

      const live = data.filter((a: any) => a.status === "LIVE");
      live.forEach((auction: any) => {
        auction.items.forEach((item: any) => {
          if (item.bids?.length > 0) {
            item.currentMin = Math.min(...item.bids.map((b: any) => b.bidValue));
          } else {
            item.currentMin = null;
          }
        });
      });

      setAuctions(live);

      if (selectedAuction) {
        const updated = live.find((a: any) => a.id === selectedAuction.id);
        if (updated) setSelectedAuction(updated);
      }
    } catch (err) {
      console.error("❌ Error fetching auctions:", err);
    }
  };

  // ⚡ Real-time SSE updates
  useEffect(() => {
    fetchAuctions();

    const sse = new EventSource("/api/sse");
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "bid_update") {
          console.log("🔄 SSE update received — refreshing auctions");
          fetchAuctions();
        }
      } catch (err) {
        console.error("SSE error:", err);
      }
    };

    return () => sse.close();
  }, []);

  const handleBidChange = (itemId: number, value: string) => {
    setBids((prev) => ({ ...prev, [itemId]: value }));
  };

  // 🚀 Submit all entered bids
  const submitBids = async () => {
    if (!selectedAuction) return;
    const supplierId = Number(localStorage.getItem("supplierId"));

    if (!supplierId || isNaN(supplierId)) {
      alert("Supplier not logged in. Please sign in again.");
      return;
    }

    const entered = Object.entries(bids).filter(([_, val]) => val.trim() !== "");
    if (entered.length === 0) {
      alert("Please enter at least one bid before submitting.");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      for (const [itemId, bidValue] of entered) {
        const response = await fetch("/api/bids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: Number(itemId),
            supplierId,
            bidValue: Number(bidValue),
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          console.error("❌ Bid failed:", result);
          alert(`Bid failed: ${result.error}`);
          continue;
        } else {
          console.log("✅ Bid success:", result);
        }
      }

      setMessage("✅ Bids submitted successfully!");
      setBids({});
      fetchAuctions();
    } catch (err) {
      console.error("🚨 Bid submission error:", err);
      alert("Error submitting bids. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
        Supplier Dashboard
      </h1>

      {message && (
        <div className="text-center mb-4 text-green-600 font-medium">
          {message}
        </div>
      )}

      {!selectedAuction ? (
        <>
          {auctions.length === 0 ? (
            <p className="text-center text-gray-500">No live auctions.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {auctions.map((a) => (
                <div
                  key={a.id}
                  className="bg-white p-4 rounded-xl shadow hover:shadow-md transition"
                >
                  <h2 className="text-lg font-semibold">{a.title}</h2>
                  <p className="text-sm text-gray-500">
                    {a.items.length} items
                  </p>
                  <button
                    onClick={() => setSelectedAuction(a)}
                    className="bg-indigo-600 text-white px-4 py-2 mt-3 rounded-lg text-sm"
                  >
                    View & Bid
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {selectedAuction.title}
            </h2>
            <button
              onClick={() => setSelectedAuction(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
          </div>

          <table className="min-w-full border text-sm text-center">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">UOM</th>
                <th className="p-2 border">Current Min (₹)</th>
                <th className="p-2 border">Your Bid (₹)</th>
              </tr>
            </thead>
            <tbody>
              {selectedAuction.items.map((item) => (
                <tr key={item.id}>
                  <td className="p-2 border">{item.description}</td>
                  <td className="p-2 border">{item.quantity}</td>
                  <td className="p-2 border">{item.uom}</td>
                  <td
                    className={`p-2 border ${
                      item.currentMin ? "text-green-700" : "text-gray-400"
                    }`}
                  >
                    {item.currentMin ? `₹${item.currentMin}` : "—"}
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      value={bids[item.id] || ""}
                      onChange={(e) =>
                        handleBidChange(item.id, e.target.value)
                      }
                      className="w-24 p-1 border rounded-md text-center"
                      placeholder="Enter"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <button
              disabled={loading}
              onClick={submitBids}
              className={`${
                loading
                  ? "bg-gray-400"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white px-6 py-2 rounded-lg transition`}
            >
              {loading ? "Submitting..." : "🚀 Submit Bids"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

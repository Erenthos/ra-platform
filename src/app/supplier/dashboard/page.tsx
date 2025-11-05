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

  // 🧠 Fetch all live auctions with bids and current minimum
  const fetchAuctions = async () => {
    try {
      const res = await fetch("/api/auctions", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch auctions");
      const data = await res.json();

      const live = data.filter((a: any) => a.status === "LIVE");

      // compute current minimum for each item
      live.forEach((auction: any) => {
        auction.items.forEach((item: any) => {
          if (item.bids && item.bids.length > 0) {
            item.currentMin = Math.min(...item.bids.map((b: any) => b.bidValue));
          } else {
            item.currentMin = null;
          }
        });
      });

      setAuctions(live);

      // if a specific auction is selected, update it
      if (selectedAuction) {
        const updated = live.find((a: any) => a.id === selectedAuction.id);
        if (updated) setSelectedAuction(updated);
      }
    } catch (err) {
      console.error("❌ Error fetching auctions:", err);
    }
  };

  // ⚡ Real-time updates via SSE
  useEffect(() => {
    fetchAuctions();

    let sse: EventSource | null = null;

    const connectSSE = () => {
      sse = new EventSource("/api/sse");

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "bid_update") {
            console.log("🔄 Received live bid update — refreshing auctions");
            fetchAuctions(); // refresh all supplier views in real time
          }
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      };

      sse.onerror = (e) => {
        console.error("SSE connection lost, reconnecting in 5s...", e);
        sse?.close();
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();
    return () => sse?.close();
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
          console.log("✅ Bid submitted:", result);
        }
      }

      setMessage("✅ Bids submitted successfully!");
      setBids({});
      fetchAuctions();
    } catch (err) {
      console.error("🚨 Bid submission error:", err);
      alert("Error submitting bids. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // 🧭 Logout handler (optional)
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/supplier/signin";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">
          Supplier Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
        >
          Logout
        </button>
      </div>

      {message && (
        <div className="text-center mb-4 text-green-600 font-medium">
          {message}
        </div>
      )}

      {!selectedAuction ? (
        <>
          {auctions.length === 0 ? (
            <p className="text-center text-gray-500">No live auctions right now.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {auctions.map((a) => (
                <div
                  key={a.id}
                  className="bg-white p-5 rounded-xl shadow hover:shadow-md transition border border-gray-100"
                >
                  <h2 className="text-lg font-semibold text-gray-800">{a.title}</h2>
                  <p className="text-sm text-gray-500 mb-3">{a.items.length} items</p>
                  <button
                    onClick={() => setSelectedAuction(a)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
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
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-semibold text-gray-800">
              {selectedAuction.title}
            </h2>
            <button
              onClick={() => setSelectedAuction(null)}
              className="text-sm text-gray-600 hover:text-gray-800"
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
                    className={`p-2 border font-semibold transition-all ${
                      item.currentMin ? "text-green-700" : "text-gray-400"
                    }`}
                  >
                    {item.currentMin ? `₹${item.currentMin}` : "—"}
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      value={bids[item.id] || ""}
                      onChange={(e) => handleBidChange(item.id, e.target.value)}
                      className="w-24 p-1 border rounded-md text-center"
                      placeholder="Enter"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-6">
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

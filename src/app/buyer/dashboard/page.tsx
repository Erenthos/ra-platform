"use client";

import { useEffect, useState } from "react";

interface Bid {
  id: number;
  supplierId: number;
  bidValue: number;
  supplier?: { username: string };
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
  durationMins: number;
  startPrice: number;
  decrementStep: number;
  items: Item[];
}

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [title, setTitle] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [decrementStep, setDecrementStep] = useState("1");
  const [durationMins, setDurationMins] = useState("10");
  const [itemsText, setItemsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ✅ Fetch all auctions
  const fetchAuctions = async () => {
    try {
      const res = await fetch("/api/auctions", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch auctions");
      const data = await res.json();
      setAuctions(data);
      if (selectedAuction) {
        const updated = data.find((a: any) => a.id === selectedAuction.id);
        if (updated) setSelectedAuction(updated);
      }
    } catch (err) {
      console.error("Error fetching auctions:", err);
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
            console.log("🔄 Live bid update received — refreshing buyer dashboard");
            fetchAuctions();
          }
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      };

      sse.onerror = (e) => {
        console.error("SSE connection lost, retrying in 5s...", e);
        sse?.close();
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();
    return () => sse?.close();
  }, []);

  // 🧾 Create a new auction
  const createAuction = async () => {
    const buyerId = Number(localStorage.getItem("buyerId"));

    if (!buyerId || isNaN(buyerId)) {
      alert("Buyer not logged in. Please sign in again.");
      return;
    }

    if (!title || !startPrice || !itemsText.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          startPrice,
          decrementStep,
          durationMins,
          itemsText,
          buyerId, // ✅ send buyerId
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create auction");

      setMessage("✅ Auction created successfully!");
      setTitle("");
      setStartPrice("");
      setDecrementStep("1");
      setDurationMins("10");
      setItemsText("");
      fetchAuctions();
    } catch (err) {
      console.error("Error creating auction:", err);
      alert("Error creating auction");
    } finally {
      setLoading(false);
    }
  };

  // ▶️ Start an auction manually
  const startAuction = async (auctionId: number) => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}/start`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start auction");
      fetchAuctions();
    } catch (err) {
      console.error("Error starting auction:", err);
    }
  };

  // ⏹️ Close an auction manually
  const closeAuction = async (auctionId: number) => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}/close`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to close auction");
      fetchAuctions();
    } catch (err) {
      console.error("Error closing auction:", err);
    }
  };

  // 🧾 Download Auction Summary PDF
  const downloadSummary = async (auctionId: number) => {
    try {
      const res = await fetch(`/api/auctions/${auctionId}/summary`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Auction_${auctionId}_Summary.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading summary:", err);
      alert("Error generating auction PDF.");
    }
  };

  // 🚪 Logout handler
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/buyer/signin";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">Buyer Dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
        >
          Logout
        </button>
      </div>

      {message && <div className="text-green-600 font-medium mb-4">{message}</div>}

      {/* Auction Creation Form */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New Auction</h2>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <input
            className="border p-2 rounded"
            placeholder="Auction Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Start Price"
            type="number"
            value={startPrice}
            onChange={(e) => setStartPrice(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Decrement Step"
            type="number"
            value={decrementStep}
            onChange={(e) => setDecrementStep(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Duration (mins)"
            type="number"
            value={durationMins}
            onChange={(e) => setDurationMins(e.target.value)}
          />
        </div>
        <textarea
          className="border w-full p-2 rounded mb-4"
          rows={4}
          placeholder="Items (Format: description, qty, uom)"
          value={itemsText}
          onChange={(e) => setItemsText(e.target.value)}
        />
        <button
          onClick={createAuction}
          disabled={loading}
          className={`px-6 py-2 rounded-lg text-white transition ${
            loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Creating..." : "Create Auction"}
        </button>
      </div>

      {/* Auction List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {auctions.map((auction) => (
          <div
            key={auction.id}
            className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {auction.title}
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Status:{" "}
              <span
                className={`font-semibold ${
                  auction.status === "LIVE"
                    ? "text-green-600"
                    : auction.status === "CLOSED"
                    ? "text-gray-500"
                    : "text-yellow-600"
                }`}
              >
                {auction.status}
              </span>
            </p>

            {auction.status === "SCHEDULED" && (
              <button
                onClick={() => startAuction(auction.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
              >
                ▶️ Start Auction
              </button>
            )}

            {auction.status === "LIVE" && (
              <button
                onClick={() => closeAuction(auction.id)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
              >
                ⏹️ Close Auction
              </button>
            )}

            {auction.status === "CLOSED" && (
              <button
                onClick={() => downloadSummary(auction.id)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
              >
                📄 Download Summary
              </button>
            )}

            <button
              onClick={() => setSelectedAuction(auction)}
              className="ml-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
            >
              View Bids
            </button>
          </div>
        ))}
      </div>

      {/* View Bids Section */}
      {selectedAuction && (
        <div className="mt-10 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedAuction.title} — Current Bids
            </h3>
            <button
              onClick={() => setSelectedAuction(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ✖ Close
            </button>
          </div>

          <table className="min-w-full border text-sm text-center">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">UOM</th>
                <th className="p-2 border">Supplier</th>
                <th className="p-2 border">Bid Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {selectedAuction.items.flatMap((item) =>
                item.bids.length > 0 ? (
                  item.bids.map((b) => (
                    <tr key={b.id}>
                      <td className="p-2 border">{item.description}</td>
                      <td className="p-2 border">{item.quantity}</td>
                      <td className="p-2 border">{item.uom}</td>
                      <td className="p-2 border">{b.supplier?.username || "Supplier"}</td>
                      <td className="p-2 border text-green-700 font-semibold">
                        ₹{b.bidValue}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key={item.id}>
                    <td className="p-2 border">{item.description}</td>
                    <td className="p-2 border">{item.quantity}</td>
                    <td className="p-2 border">{item.uom}</td>
                    <td className="p-2 border text-gray-400" colSpan={2}>
                      No Bids Yet
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [decrementStep, setDecrementStep] = useState("1");
  const [durationMins, setDurationMins] = useState("10");
  const [itemsText, setItemsText] = useState("");

  // Fetch auctions
  useEffect(() => {
    fetchAuctions();
  }, []);

  async function fetchAuctions() {
    try {
      setLoading(true);
      const res = await fetch("/api/auctions", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch auctions");
      const data = await res.json();
      setAuctions(data);
    } catch (err) {
      console.error(err);
      setError("Error loading auctions.");
    } finally {
      setLoading(false);
    }
  }

  // Create new auction
  async function handleCreateAuction(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          startPrice,
          decrementStep,
          durationMins,
          itemsText,
        }),
      });

      if (res.ok) {
        alert("Auction created successfully!");
        setTitle("");
        setStartPrice("");
        setDecrementStep("1");
        setDurationMins("10");
        setItemsText("");
        fetchAuctions();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create auction.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while creating auction.");
    }
  }

  // Start auction
  async function startAuction(id: number) {
    if (!confirm("Are you sure you want to start this auction?")) return;

    try {
      const res = await fetch(`/api/auctions/start/${id}`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        alert("Auction started successfully!");
        fetchAuctions();
      } else {
        alert(data.error || "Failed to start auction.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while starting auction.");
    }
  }

  // Close auction
  async function closeAuction(id: number) {
    if (!confirm("Are you sure you want to close this auction?")) return;

    try {
      const res = await fetch(`/api/auctions/close/${id}`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        alert("Auction closed successfully!");
        fetchAuctions();
      } else {
        alert(data.error || "Failed to close auction.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while closing auction.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700">
          Buyer Dashboard
        </h1>
        <button
          onClick={fetchAuctions}
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Auction Creation Form */}
      <section className="bg-white shadow-lg rounded-xl p-6 mb-10 border border-gray-100 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-blue-600 mb-4">
          Create New Auction
        </h2>

        <form onSubmit={handleCreateAuction} className="space-y-4">
          <input
            type="text"
            placeholder="Auction Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Start Price"
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <input
              type="number"
              placeholder="Decrement Step"
              value={decrementStep}
              onChange={(e) => setDecrementStep(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          <input
            type="number"
            placeholder="Duration (minutes)"
            value={durationMins}
            onChange={(e) => setDurationMins(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />

          <textarea
            placeholder="Items (one per line, format: description, quantity, uom)"
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none font-mono"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Create Auction
          </button>
        </form>
      </section>

      {/* Auction List */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center sm:text-left">
          Your Auctions
        </h2>

        {loading ? (
          <p className="text-center">Loading auctions...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : auctions.length === 0 ? (
          <p className="text-gray-500 text-center">No auctions created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <div
                key={auction.id}
                className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-blue-700">
                  {auction.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Status:{" "}
                  <span
                    className={`font-medium ${
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
                <p className="text-sm text-gray-600">
                  Start Price: ₹{auction.startPrice}
                </p>
                <p className="text-sm text-gray-600">
                  Step: ₹{auction.decrementStep}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Duration: {auction.durationMins} mins
                </p>

                {/* Start Button */}
                {auction.status === "SCHEDULED" && (
                  <button
                    onClick={() => startAuction(auction.id)}
                    className="mt-2 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    ▶️ Start Auction
                  </button>
                )}

                {/* Close Button */}
                {auction.status === "LIVE" && (
                  <button
                    onClick={() => closeAuction(auction.id)}
                    className="mt-2 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    ⏹ Close Auction
                  </button>
                )}

                {/* Status Indicators */}
                {auction.status === "LIVE" && (
                  <div className="mt-2 text-center text-green-600 font-semibold">
                    🔴 Auction is LIVE
                  </div>
                )}
                {auction.status === "CLOSED" && (
                  <div className="mt-2 text-center text-gray-500 font-medium">
                    ✅ Auction Closed
                  </div>
                )}

                {/* Bid Section */}
                <details className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-blue-600">
                    View Current Bids
                  </summary>
                  <div className="mt-2 text-sm text-gray-700">
                    {auction.bids && auction.bids.length > 0 ? (
                      <ul className="space-y-1">
                        {auction.bids.map((bid: any) => (
                          <li key={bid.id}>
                            Supplier #{bid.supplierId}: ₹{bid.bidValue}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No bids yet.</p>
                    )}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

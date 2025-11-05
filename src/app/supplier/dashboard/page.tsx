"use client";

import React, { useEffect, useState } from "react";

export default function SupplierDashboard() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<any | null>(null);
  const [bidValues, setBidValues] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState<number | null>(1); // replace with logged-in supplier ID

  useEffect(() => {
    fetchAuctions();
  }, []);

  async function fetchAuctions() {
    try {
      setLoading(true);
      const res = await fetch("/api/auctions", { cache: "no-store" });
      const data = await res.json();
      const live = data.filter((a: any) => a.status === "LIVE");
      setAuctions(live);
    } catch (err) {
      console.error("Error fetching auctions", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAuctionDetails(id: number) {
    const res = await fetch(`/api/auctions/${id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setSelectedAuction(data);
    }
  }

  async function submitBids() {
    if (!selectedAuction) return;
    const bids = Object.entries(bidValues).map(([itemId, value]) => ({
      itemId: Number(itemId),
      bidValue: parseFloat(value),
    }));

    const res = await fetch("/api/bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId,
        auctionId: selectedAuction.id,
        bids,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Bids submitted successfully!");
      setBidValues({});
      fetchAuctionDetails(selectedAuction.id);
    } else {
      alert(data.error || "Failed to submit bids.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">
        Supplier Dashboard
      </h1>

      {/* Auction Selection */}
      {!selectedAuction ? (
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-700">
            Live Auctions
          </h2>
          {loading ? (
            <p>Loading...</p>
          ) : auctions.length === 0 ? (
            <p className="text-gray-500">No live auctions available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {auctions.map((a) => (
                <div
                  key={a.id}
                  className="bg-white border rounded-lg shadow-sm p-5 hover:shadow-md transition"
                >
                  <h3 className="text-lg font-semibold text-blue-700">
                    {a.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Start Price: ₹{a.startPrice}
                  </p>
                  <p className="text-sm text-gray-600">
                    Step: ₹{a.decrementStep}
                  </p>
                  <button
                    onClick={() => fetchAuctionDetails(a.id)}
                    className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    View & Bid
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={() => setSelectedAuction(null)}
            className="mb-4 text-blue-600 hover:underline"
          >
            ← Back to Auctions
          </button>

          <h2 className="text-2xl font-bold text-blue-700 mb-4">
            {selectedAuction.title}
          </h2>

          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="p-3 border-b">Item</th>
                <th className="p-3 border-b">Qty</th>
                <th className="p-3 border-b">UOM</th>
                <th className="p-3 border-b">Current Min</th>
                <th className="p-3 border-b">Your Bid</th>
              </tr>
            </thead>
            <tbody>
              {selectedAuction.items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{item.description}</td>
                  <td className="p-3 border-b">{item.quantity}</td>
                  <td className="p-3 border-b">{item.uom}</td>
                  <td className="p-3 border-b text-green-700 font-semibold">
                    ₹{item.currentMin ?? "—"}
                  </td>
                  <td className="p-3 border-b">
                    <input
                      type="number"
                      value={bidValues[item.id] || ""}
                      onChange={(e) =>
                        setBidValues({
                          ...bidValues,
                          [item.id]: e.target.value,
                        })
                      }
                      className="w-24 px-2 py-1 border rounded-md"
                      placeholder="Bid"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={submitBids}
            className="mt-5 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Submit Bids
          </button>
        </>
      )}
    </main>
  );
}

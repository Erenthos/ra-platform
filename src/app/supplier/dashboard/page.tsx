"use client";

import React, { useEffect, useState } from "react";

// ✅ Explicitly define the shape of auctions coming from the API
type AuctionType = {
  id: number;
  title: string;
  startPrice: number;
  decrementStep: number;
  durationMins: number;
  status?: string; // optional so build never fails
};

export default function SupplierDashboard() {
  const [auctions, setAuctions] = useState<AuctionType[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuctions() {
      try {
        const res = await fetch("/api/auctions", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch auctions");

        const all = (await res.json()) as AuctionType[];

        // ✅ don’t use inline type in callback
        const live = all.filter((a) => a.status === "LIVE");
        setAuctions(live);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load auctions.");
      }
    }

    fetchAuctions();
    const interval = setInterval(fetchAuctions, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Supplier Dashboard</h1>

      {error && (
        <div className="text-red-600 mb-4 bg-red-100 p-2 rounded">{error}</div>
      )}

      {auctions.length === 0 ? (
        <p className="text-gray-500">No live auctions available right now.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              className="bg-white shadow-md rounded-lg p-5 border border-gray-200 hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold text-gray-800">
                {auction.title}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Duration: {auction.durationMins} mins
              </p>
              <p className="text-gray-600 text-sm">
                Start Price: ₹{auction.startPrice}
              </p>
              <p className="text-gray-600 text-sm mb-2">
                Step: ₹{auction.decrementStep}
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  auction.status === "LIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {auction.status || "N/A"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

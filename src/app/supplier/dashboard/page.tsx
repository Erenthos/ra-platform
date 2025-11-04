"use client";

import { useEffect, useState } from "react";

type Item = {
  id: number;
  description: string;
  quantity: number;
  uom: string;
  currentMin: number | null;
};

type Auction = {
  id: number;
  title: string;
  startPrice: number;
  decrementStep: number;
  durationMins: number;
  endTime: string;
  items: Item[];
};

export default function SupplierDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<Record<number, number>>({});
  const [message, setMessage] = useState<string | null>(null);

  // Load all LIVE auctions initially
  useEffect(() => {
    fetchAuctions();
  }, []);

  // Subscribe to real-time bid updates (SSE)
  useEffect(() => {
    const eventSource = new EventSource("/api/sse");

    eventSource.addEventListener("bidUpdate", (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      setAuctions((prev) =>
        prev.map((a) =>
          a.id === data.auctionId
            ? {
                ...a,
                items: a.items.map((it) => {
                  const updated = data.items.find(
                    (x: any) => x.itemId === it.id
                  );
                  return updated
                    ? { ...it, currentMin: updated.currentMin }
                    : it;
                }),
              }
            : a
        )
      );
    });

    eventSource.onerror = (e) => console.error("SSE error:", e);
    return () => eventSource.close();
  }, []);

  async function fetchAuctions() {
    setLoading(true);
    try {
      const res = await fetch("/api/auctions");
      if (!res.ok) throw new Error("Failed to fetch auctions");
      const all = await res.json();
      const live = all.filter((a: Auction) => a.status === "LIVE");
      setAuctions(live);
    } catch (err: any) {
      console.error(err);
      setMessage("Error fetching auctions");
    } finally {
      setLoading(false);
    }
  }

  // Handle bid change
  function handleBidChange(itemId: number, value: string) {
    setBids((prev) => ({ ...prev, [itemId]: Number(value) }));
  }

  // Submit all bids at once
  async function handleSubmit(auctionId: number) {
    const entries = Object.entries(bids)
      .filter(([_, v]) => v && !isNaN(v))
      .map(([itemId, bidValue]) => ({
        itemId: Number(itemId),
        bidValue: Number(bidValue),
      }));

    if (entries.length === 0) {
      setMessage("Please enter at least one valid bid before submitting.");
      return;
    }

    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId, bids: entries }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to submit bids.");
        return;
      }

      setMessage("✅ Bids submitted successfully!");
      setBids({});
    } catch (err: any) {
      console.error(err);
      setMessage("❌ Server error submitting bids.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Supplier Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              View live auctions and place your bids in real time.
            </p>
          </div>
          <button
            onClick={() => fetchAuctions()}
            className="px-4 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </header>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
            {message}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-slate-500">
            Loading live auctions…
          </div>
        ) : auctions.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            No live auctions available.
          </div>
        ) : (
          <div className="grid gap-6">
            {auctions.map((a) => (
              <article
                key={a.id}
                className="bg-white shadow rounded-xl p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      {a.title}
                    </h2>
                    <div className="text-sm text-slate-500 mt-1">
                      Start Price: <b>{a.startPrice}</b> | Step:{" "}
                      <b>{a.decrementStep}</b> | Duration:{" "}
                      <b>{a.durationMins} mins</b>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Ends: {new Date(a.endTime).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-slate-500 border-b">
                        <th className="text-left py-2">#</th>
                        <th className="text-left py-2">Description</th>
                        <th className="text-left py-2">Qty</th>
                        <th className="text-left py-2">UOM</th>
                        <th className="text-left py-2">Current Min</th>
                        <th className="text-left py-2">Your Bid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.items.map((it, idx) => (
                        <tr key={it.id} className="border-b hover:bg-slate-50">
                          <td className="py-2 text-slate-600">{idx + 1}</td>
                          <td className="py-2 text-slate-800">
                            {it.description}
                          </td>
                          <td className="py-2 text-slate-700">{it.quantity}</td>
                          <td className="py-2 text-slate-700">{it.uom}</td>
                          <td className="py-2 text-emerald-600 font-medium">
                            {it.currentMin ? it.currentMin.toFixed(2) : "—"}
                          </td>
                          <td className="py-2">
                            <input
                              type="number"
                              placeholder="Enter bid"
                              value={bids[it.id] ?? ""}
                              onChange={(e) =>
                                handleBidChange(it.id, e.target.value)
                              }
                              className="w-28 border rounded-lg px-2 py-1 text-slate-700 focus:ring-2 focus:ring-blue-300 outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleSubmit(a.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit Bids
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = {
  id?: number;
  description: string;
  quantity: number;
  uom?: string;
};

type Auction = {
  id: number;
  title: string;
  decrementStep: number;
  durationMins: number;
  startPrice: number;
  status: string;
  createdAt: string;
  items?: Item[];
};

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  // form fields
  const [title, setTitle] = useState("");
  const [startPrice, setStartPrice] = useState<number | "">("");
  const [decrementStep, setDecrementStep] = useState<number | "">(1);
  const [durationMins, setDurationMins] = useState<number | "">(10);
  const [itemsText, setItemsText] = useState<string>(""); // each line: desc, qty, uom

  useEffect(() => {
    fetchAuctions();
  }, []);

  async function fetchAuctions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auctions");
      if (!res.ok) throw new Error("Failed to fetch auctions");
      const data: Auction[] = await res.json();
      setAuctions(data || []);
    } catch (err: any) {
      setError(err.message || "Error fetching auctions");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);

    if (!title || !startPrice) {
      setCreateMsg("Please provide title and start price.");
      setCreating(false);
      return;
    }

    try {
      const payload = {
        title,
        startPrice: Number(startPrice),
        decrementStep: Number(decrementStep),
        durationMins: Number(durationMins),
        itemsText, // backend expects newline separated items: desc, qty, uom
      };

      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateMsg(data?.error || "Failed to create auction");
      } else {
        setCreateMsg("Auction created successfully!");
        // reset form
        setTitle("");
        setStartPrice("");
        setDecrementStep(1);
        setDurationMins(10);
        setItemsText("");
        setShowCreate(false);
        // refresh list
        await fetchAuctions();
      }
    } catch (err: any) {
      setCreateMsg(err.message || "Server error");
    } finally {
      setCreating(false);
    }
  }

  async function startAuction(id: number) {
    // This expects a runtime API route like POST /api/auctions/{id}/start
    // If you don't have it yet, implement on server to set start_time, status and end_time.
    if (!confirm("Start this auction now? This will set it LIVE for the configured duration.")) return;

    try {
      const res = await fetch(`/api/auctions/${id}/start`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        alert("Failed to start auction: " + (body?.error || res.statusText));
        return;
      }
      alert("Auction started successfully.");
      fetchAuctions();
    } catch (err: any) {
      alert("Server error: " + (err.message || "unknown"));
    }
  }

  async function closeAuction(id: number) {
    if (!confirm("Close this auction now?")) return;
    try {
      const res = await fetch(`/api/auctions/${id}/close`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        alert("Failed to close auction: " + (body?.error || res.statusText));
        return;
      }
      alert("Auction closed.");
      fetchAuctions();
    } catch (err: any) {
      alert("Server error: " + (err.message || "unknown"));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Buyer Dashboard</h1>
            <p className="text-slate-500 mt-1">
              Create and manage reverse auctions. Monitor live bids and download results.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              + Create Auction
            </button>
            <button
              onClick={() => fetchAuctions()}
              className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition"
            >
              Refresh
            </button>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Auctions List */}
        <section>
          {loading ? (
            <div className="py-10 text-center text-slate-500">Loading auctions…</div>
          ) : auctions.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              No auctions yet. Click <b>Create Auction</b> to get started.
            </div>
          ) : (
            <div className="grid gap-6">
              {auctions.map((a) => (
                <article key={a.id} className="bg-white shadow rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <h2 className="text-xl font-semibold text-slate-800">{a.title}</h2>
                        <span className="text-sm px-2 py-1 rounded text-slate-600 bg-slate-100">
                          {a.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        Start Price: <b>{a.startPrice}</b> · Decrement step: <b>{a.decrementStep}</b> · Duration: <b>{a.durationMins} mins</b>
                      </div>
                      <div className="text-xs text-slate-400 mt-2">Created: {new Date(a.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Start / Close actions */}
                      {a.status === "SCHEDULED" && (
                        <button
                          onClick={() => startAuction(a.id)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
                        >
                          Start Auction
                        </button>
                      )}
                      {a.status === "LIVE" && (
                        <button
                          onClick={() => closeAuction(a.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Close Auction
                        </button>
                      )}

                      {/* Details & PDF */}
                      <Link
                        href={`/buyer/auctions/${a.id}`}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        Details
                      </Link>

                      <a
                        href={`/api/auctions/${a.id}/summary`}
                        className="px-3 py-1 bg-slate-800 text-white rounded text-sm"
                      >
                        Download PDF
                      </a>
                    </div>
                  </div>

                  {/* Items table */}
                  <div className="mt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-slate-500">
                            <th className="py-2">#</th>
                            <th className="py-2">Item</th>
                            <th className="py-2">Qty</th>
                            <th className="py-2">UOM</th>
                            <th className="py-2">Lowest Bid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a.items && a.items.length > 0 ? (
                            a.items.map((it: Item, idx: number) => (
                              <tr key={idx} className="border-t">
                                <td className="py-2 text-slate-600">{idx + 1}</td>
                                <td className="py-2 text-slate-800">{it.description}</td>
                                <td className="py-2 text-slate-700">{it.quantity}</td>
                                <td className="py-2 text-slate-700">{it.uom || "NOS"}</td>
                                <td className="py-2 text-slate-700">—</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-4 text-slate-500">
                                No items added to this auction.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Create Auction Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-semibold">Create Auction</h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <form className="mt-4 space-y-4" onSubmit={handleCreate}>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Auction Title"
                    className="col-span-2 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  />
                  <input
                    value={startPrice}
                    onChange={(e) => setStartPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Start Price"
                    type="number"
                    className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  />
                  <input
                    value={decrementStep}
                    onChange={(e) => setDecrementStep(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Decrement step (X)"
                    type="number"
                    className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <input
                    value={durationMins}
                    onChange={(e) => setDurationMins(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Duration (mins)"
                    type="number"
                    className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-1">
                    Items (one per line: description, quantity, uom)
                  </label>
                  <textarea
                    value={itemsText}
                    onChange={(e) => setItemsText(e.target.value)}
                    className="w-full min-h-[120px] px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder={`Example:\n50mm Solar Cable, 100, NOS\n3.5mm Cable, 10, MTR`}
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 border rounded-lg"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create Auction"}
                  </button>
                </div>

                {createMsg && (
                  <div className="mt-2 text-sm text-slate-700">{createMsg}</div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

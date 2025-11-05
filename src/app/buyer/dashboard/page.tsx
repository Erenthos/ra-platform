"use client";

import { useState, useEffect } from "react";

type Auction = {
  id: number;
  title: string;
  startPrice: number;
  decrementStep: number;
  durationMins: number;
  status: string;
  createdAt: string;
  items: {
    id: number;
    description: string;
    quantity: number;
    uom: string;
    bids?: { bidValue: number }[];
  }[];
};

export default function BuyerDashboard() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [title, setTitle] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [decrementStep, setDecrementStep] = useState("");
  const [durationMins, setDurationMins] = useState("10");
  const [items, setItems] = useState([{ description: "", quantity: "", uom: "" }]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // TODO: Replace with logged-in buyer’s actual ID (from token/session)
  const buyerId = 1;

  useEffect(() => {
    fetchAuctions();
  }, []);

  async function fetchAuctions() {
    setLoading(true);
    try {
      const res = await fetch("/api/auctions");
      if (!res.ok) throw new Error("Failed to fetch auctions");
      const data = await res.json();
      setAuctions(data);
    } catch (err) {
      console.error(err);
      setMessage("Error fetching auctions");
    } finally {
      setLoading(false);
    }
  }

  function handleItemChange(index: number, field: string, value: string) {
    setItems((prev) => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  }

  function addItemRow() {
    setItems([...items, { description: "", quantity: "", uom: "" }]);
  }

  function removeItemRow(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleCreateAuction() {
    if (!title || !startPrice || !decrementStep) {
      setMessage("Please fill all required fields");
      return;
    }

    const itemsText = items
      .filter((i) => i.description.trim() !== "")
      .map((i) => `${i.description},${i.quantity || 1},${i.uom || "NOS"}`)
      .join("\n");

    const payload = {
      title,
      startPrice,
      decrementStep,
      durationMins,
      buyerId,
      itemsText,
    };

    try {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Error creating auction");
        return;
      }
      setMessage("✅ Auction created successfully!");
      setTitle("");
      setStartPrice("");
      setDecrementStep("");
      setItems([{ description: "", quantity: "", uom: "" }]);
      await fetchAuctions();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to create auction");
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
              Create and monitor your reverse auctions in real time.
            </p>
          </div>
          <button
            onClick={fetchAuctions}
            className="px-4 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-100"
          >
            Refresh
          </button>
        </header>

        {/* Message */}
        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
            {message}
          </div>
        )}

        {/* Auction Creation Card */}
        <section className="bg-white shadow-md rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Create New Auction
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Auction Title
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter auction title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Start Price
              </label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 outline-none"
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
                placeholder="Enter starting price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Decrement Step
              </label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 outline-none"
                value={decrementStep}
                onChange={(e) => setDecrementStep(e.target.value)}
                placeholder="Enter minimum decrement value"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 outline-none"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          {/* Auction Items */}
          <h3 className="mt-6 text-lg font-medium text-slate-700">Auction Items</h3>
          <div className="mt-3 space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg"
              >
                <input
                  type="text"
                  className="col-span-6 border rounded-lg px-3 py-1 text-sm"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                />
                <input
                  type="number"
                  className="col-span-2 border rounded-lg px-3 py-1 text-sm"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                />
                <input
                  type="text"
                  className="col-span-2 border rounded-lg px-3 py-1 text-sm"
                  placeholder="UOM"
                  value={item.uom}
                  onChange={(e) => handleItemChange(index, "uom", e.target.value)}
                />
                <div className="col-span-2 flex justify-center">
                  {index > 0 && (
                    <button
                      onClick={() => removeItemRow(index)}
                      className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addItemRow}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            + Add Item
          </button>

          <div className="mt-6 text-right">
            <button
              onClick={handleCreateAuction}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Auction
            </button>
          </div>
        </section>

        {/* Auction List */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Your Auctions
          </h2>

          {loading ? (
            <div className="text-slate-500">Loading auctions...</div>
          ) : auctions.length === 0 ? (
            <div className="text-slate-500">No auctions created yet.</div>
          ) : (
            <div className="grid gap-6">
              {auctions.map((a) => (
                <div
                  key={a.id}
                  className="bg-white shadow rounded-xl p-6 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {a.title}
                      </h3>
                      <p className="text-slate-500 text-sm">
                        {a.status} • Created:{" "}
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        a.status === "LIVE"
                          ? "bg-green-100 text-green-700"
                          : a.status === "CLOSED"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  <table className="w-full mt-4 text-sm border-collapse">
                    <thead>
                      <tr className="text-slate-500 border-b">
                        <th className="text-left py-2">Item</th>
                        <th className="text-left py-2">Qty</th>
                        <th className="text-left py-2">UOM</th>
                        <th className="text-left py-2">Lowest Bid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.items.map((it) => (
                        <tr key={it.id} className="border-b">
                          <td className="py-2 text-slate-800">
                            {it.description}
                          </td>
                          <td className="py-2 text-slate-700">{it.quantity}</td>
                          <td className="py-2 text-slate-700">{it.uom}</td>
                          <td className="py-2 text-emerald-600 font-medium">
                            {it.bids?.[0]?.bidValue ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

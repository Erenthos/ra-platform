'use client';

import React, { useState, useEffect } from 'react';

export default function BuyerPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [decrement, setDecrement] = useState(1);
  const [duration, setDuration] = useState(10);
  const [startPrice, setStartPrice] = useState(1000);
  const [itemsText, setItemsText] = useState('');

  useEffect(() => {
    fetch('/api/auctions')
      .then(r => r.json())
      .then(setAuctions)
      .catch(() => setAuctions([]));
  }, []);

  async function createAuction(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auctions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        decrementStep: Number(decrement),
        durationMins: Number(duration),
        startPrice: Number(startPrice),
        itemsText
      })
    });

    if (res.ok) {
      setTitle('');
      setItemsText('');
      const data = await res.json();
      setAuctions([data, ...auctions]);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Buyer Dashboard</h1>

      {/* Create Auction Section */}
      <section className="mb-8 p-4 border rounded-md bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Create New Auction</h2>
        <form onSubmit={createAuction} className="space-y-3">
          <input
            className="border p-2 w-full rounded"
            placeholder="Auction Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <div className="flex gap-2">
            <input
              className="border p-2 w-1/3 rounded"
              type="number"
              placeholder="Decrement"
              value={decrement}
              onChange={e => setDecrement(Number(e.target.value))}
            />
            <input
              className="border p-2 w-1/3 rounded"
              type="number"
              placeholder="Duration (mins)"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
            />
            <input
              className="border p-2 w-1/3 rounded"
              type="number"
              placeholder="Start Price"
              value={startPrice}
              onChange={e => setStartPrice(Number(e.target.value))}
            />
          </div>

          <textarea
            className="border p-2 w-full rounded"
            placeholder="Items (one per line: desc,qty,uom)"
            value={itemsText}
            onChange={e => setItemsText(e.target.value)}
            rows={4}
          />

          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Create Auction
          </button>
        </form>
      </section>

      {/* Auction List */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Your Auctions</h2>
        <ul className="space-y-3">
          {auctions.map(a => (
            <li key={a.id} className="border p-3 rounded bg-white shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-800">{a.title}</div>
                  <div className="text-sm text-gray-600">Status: {a.status}</div>
                </div>
                <a
                  href={`/api/auctions/${a.id}/summary`}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Download PDF Summary
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

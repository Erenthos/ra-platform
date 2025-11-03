'use client';

import React, { useEffect, useState } from 'react';

export default function SupplierPage() {
  const [liveAuctions, setLiveAuctions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/auctions?live=1')
      .then(res => res.json())
      .then(setLiveAuctions)
      .catch(() => setLiveAuctions([]));
  }, []);

  async function submitBids(auctionId: number, bids: Record<number, number>) {
    await fetch('/api/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auctionId, bids })
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Supplier Dashboard</h1>
      {liveAuctions.length === 0 ? (
        <p className="text-gray-600">No live auctions right now.</p>
      ) : (
        <div className="space-y-6">
          {liveAuctions.map(a => (
            <AuctionCard key={a.id} auction={a} onSubmit={submitBids} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuctionCard({ auction, onSubmit }: { auction: any; onSubmit: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [bidInputs, setBidInputs] = useState<Record<number, number>>({});

  useEffect(() => {
    fetch(`/api/auctions/${auction.id}`)
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        const initial: Record<number, number> = {};
        (data.items || []).forEach((it: any) => (initial[it.id] = 0));
        setBidInputs(initial);
      });
  }, [auction.id]);

  return (
    <div className="border rounded p-4 bg-white shadow-sm">
      <h2 className="font-semibold text-lg mb-2">{auction.title}</h2>
      <div className="space-y-3">
        {items.map(it => (
          <div key={it.id} className="flex items-center gap-3 border-b pb-2">
            <div className="flex-1">
              <p className="font-medium">{it.description}</p>
              <p className="text-sm text-gray-600">
                Qty: {it.quantity} {it.uom} | Current Min: <b>{it.currentMin}</b>
              </p>
            </div>
            <input
              type="number"
              className="border p-2 rounded w-32"
              value={bidInputs[it.id] || ''}
              onChange={e => setBidInputs({ ...bidInputs, [it.id]: Number(e.target.value) })}
              placeholder="Your bid"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => onSubmit(auction.id, bidInputs)}
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Submit Bids
      </button>
    </div>
  );
}

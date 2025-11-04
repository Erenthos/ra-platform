"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <h1 className="text-3xl font-bold mb-6">🚀 Reverse Auction Platform</h1>
      <p className="mb-8 text-gray-600">
        Welcome! Please choose your role below to continue.
      </p>
      <div className="flex gap-4">
        <Link
          href="/buyer"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Buyer Dashboard
        </Link>
        <Link
          href="/supplier"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Supplier Dashboard
        </Link>
      </div>
    </main>
  );
}

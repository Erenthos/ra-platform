"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">🚀 Reverse Auction Platform</h1>
        <p className="text-gray-600 mb-8">
          Welcome! Please choose your role below to continue.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/buyer"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Buyer Dashboard
          </Link>
          <Link
            href="/supplier"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Supplier Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

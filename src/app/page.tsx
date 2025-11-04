"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">🚀 Reverse Auction Platform</h1>
        <p className="text-gray-600 mb-8">
          Welcome! Please sign in or sign up to continue.
        </p>

        <div className="grid grid-cols-2 gap-8">
          {/* Buyer Section */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="font-semibold text-lg mb-3">Buyer</h2>
            <div className="flex justify-center gap-3">
              <Link
                href="/buyer/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
              <Link
                href="/buyer/signup"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* Supplier Section */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="font-semibold text-lg mb-3">Supplier</h2>
            <div className="flex justify-center gap-3">
              <Link
                href="/supplier/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
              <Link
                href="/supplier/signup"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

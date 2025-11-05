"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col justify-center items-center text-center px-6 py-10">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 tracking-tight">
          🚀 Reverse Auction Platform
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mt-3">
          Welcome! Please sign in or sign up to continue.
        </p>
      </header>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 max-w-4xl w-full">
        {/* Buyer Card */}
        <div className="bg-white shadow-lg rounded-2xl p-8 hover:shadow-xl transition duration-300 border border-gray-100">
          <h2 className="text-2xl font-semibold text-blue-700 mb-4">
            Buyer Portal
          </h2>
          <p className="text-gray-600 mb-6">
            Create and manage live reverse auctions with suppliers in real time.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/buyer/signin"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
            <Link
              href="/buyer/signup"
              className="px-5 py-2.5 border border-blue-600 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Supplier Card */}
        <div className="bg-white shadow-lg rounded-2xl p-8 hover:shadow-xl transition duration-300 border border-gray-100">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">
            Supplier Portal
          </h2>
          <p className="text-gray-600 mb-6">
            Participate in live auctions, view current minimum bids, and submit
            your offers instantly.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/supplier/signin"
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              Sign In
            </Link>
            <Link
              href="/supplier/signup"
              className="px-5 py-2.5 border border-green-600 text-green-700 rounded-lg font-medium hover:bg-green-50 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-gray-500 text-sm">
        © {new Date().getFullYear()} Reverse Auction Platform. All rights reserved.
      </footer>
    </main>
  );
}

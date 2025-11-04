"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-3 tracking-tight">
          🚀 Reverse Auction Platform
        </h1>
        <p className="text-gray-600 text-lg">
          Welcome! Please sign in or sign up to continue.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 w-full max-w-3xl">
        {/* Buyer Card */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-8 transition hover:shadow-2xl hover:-translate-y-1 duration-300">
          <h2 className="text-xl font-semibold text-blue-700 mb-6 text-center">
            Buyer
          </h2>
          <div className="flex justify-center gap-6">
            <Link
              href="/buyer/signin"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
            <Link
              href="/buyer/signup"
              className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg shadow-sm hover:bg-green-700 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Supplier Card */}
        <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-8 transition hover:shadow-2xl hover:-translate-y-1 duration-300">
          <h2 className="text-xl font-semibold text-green-700 mb-6 text-center">
            Supplier
          </h2>
          <div className="flex justify-center gap-6">
            <Link
              href="/supplier/signin"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
            <Link
              href="/supplier/signup"
              className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg shadow-sm hover:bg-green-700 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      <footer className="mt-16 text-gray-500 text-sm">
        © {new Date().getFullYear()} Reverse Auction Platform. All rights reserved.
      </footer>
    </main>
  );
}

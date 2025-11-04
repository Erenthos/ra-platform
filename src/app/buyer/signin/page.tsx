"use client";
import Link from "next/link";

export default function BuyerSignIn() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-6">
      <div className="bg-white/90 shadow-lg rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-2">
          Buyer Sign In
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Access your buyer dashboard
        </p>

        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don’t have an account?{" "}
          <Link
            href="/buyer/signup"
            className="text-blue-600 font-medium hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";
import Link from "next/link";

export default function SupplierSignUp() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-6">
      <div className="bg-white/90 shadow-lg rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-green-700 mb-2">
          Supplier Sign Up
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Register as a supplier to participate in auctions
        </p>

        <form className="space-y-4">
          <input
            type="text"
            placeholder="Company Name"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
          />
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            href="/supplier/signin"
            className="text-green-600 font-medium hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}

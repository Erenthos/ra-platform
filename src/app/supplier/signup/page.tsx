"use client";
import { useState } from "react";
import Link from "next/link";

export default function SupplierSignUp() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = e.currentTarget;
    const company = (form.elements.namedItem("company") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: company, email, password, role: "supplier" }),
    });

    const data = await res.json();
    setLoading(false);
    setMessage(data.success ? "✅ Signup successful!" : `❌ ${data.error}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-6">
      <div className="bg-white/90 shadow-lg rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-green-700 mb-2">
          Supplier Sign Up
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Register as a supplier to participate in auctions
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            name="company"
            type="text"
            placeholder="Company Name"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
          />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {message && (
          <p className="text-center text-sm mt-4 text-gray-700">{message}</p>
        )}

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

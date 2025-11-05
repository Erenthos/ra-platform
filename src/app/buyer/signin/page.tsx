"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyerSignIn() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: "buyer" }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Login successful! Redirecting...");
        setTimeout(() => {
          router.push("/buyer/dashboard");
        }, 1000);
      } else {
        setMessage(data.error || "Invalid credentials.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error while logging in.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8 border border-gray-100">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Buyer Sign In
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </form>
        {message && (
          <p className="text-center text-gray-600 mt-4 text-sm">{message}</p>
        )}
        <p className="text-sm text-center text-gray-500 mt-6">
          Don't have an account?{" "}
          <a
            href="/buyer/signup"
            className="text-blue-600 font-medium hover:underline"
          >
            Sign Up
          </a>
        </p>
      </div>
    </main>
  );
}

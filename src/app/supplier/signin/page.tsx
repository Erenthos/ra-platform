"use client";

import { useState } from "react";

export default function SupplierSignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role: "supplier" }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Login failed");
      }

      // ✅ Defensive: safely extract ID or fallback
      const supplierId = result.id || result.userId || null;

      if (!supplierId) {
        throw new Error("Invalid response: Missing supplier ID");
      }

      // ✅ Save all supplier details in localStorage
      localStorage.setItem("supplierId", String(supplierId));
      localStorage.setItem("supplierToken", result.token);
      localStorage.setItem("supplierUsername", result.username);
      localStorage.setItem("supplierRole", result.role);

      // Redirect to dashboard
      window.location.href = "/supplier/dashboard";
    } catch (err: any) {
      console.error("Supplier SignIn error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 text-center">
          Supplier Sign In
        </h2>

        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="border p-2 rounded w-full mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded w-full mb-5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignIn}
          disabled={loading}
          className={`w-full py-2 rounded text-white font-semibold transition ${
            loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}

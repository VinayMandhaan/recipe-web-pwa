"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Name is required");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, name);
      if (error) setError(error);
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0a0f] safe-top safe-bottom">
      {/* Top section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mb-5">
          <span className="text-3xl">🍳</span>
        </div>
        <h1 className="text-2xl font-bold text-[#f0f0f5]">ReelRecipe</h1>
        <p className="text-sm text-[#55556a] mt-1">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </p>
      </div>

      {/* Form */}
      <div className="px-6 pb-8">
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-4 py-3.5 bg-[#16161e] border border-[#2a2a3a] rounded-xl text-sm text-[#f0f0f5]
                         focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50
                         placeholder:text-[#3a3a4a]"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3.5 bg-[#16161e] border border-[#2a2a3a] rounded-xl text-sm text-[#f0f0f5]
                       focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50
                       placeholder:text-[#3a3a4a]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full px-4 py-3.5 bg-[#16161e] border border-[#2a2a3a] rounded-xl text-sm text-[#f0f0f5]
                       focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50
                       placeholder:text-[#3a3a4a]"
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 gradient-accent text-white font-semibold rounded-xl text-sm
                       active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </span>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-[#55556a] mt-5">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="text-orange-500 font-medium"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}

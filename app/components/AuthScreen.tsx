"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

function Logo() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect width="72" height="72" rx="18" fill="url(#logo-bg)" />
      {/* Phone outline */}
      <rect x="20" y="12" width="26" height="42" rx="5" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.9" />
      <line x1="29" y1="49" x2="39" y2="49" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      {/* Play button inside phone */}
      <path d="M29 27 L29 39 L39 33 Z" fill="white" fillOpacity="0.9" />
      {/* Fork peeking from right side */}
      <g transform="translate(48, 20)">
        <path
          d="M2 0 L2 8 M5.5 0 L5.5 8 M9 0 L9 8 M0.5 8 Q0.5 12 5.5 12 Q10.5 12 10.5 8 M5.5 12 L5.5 28"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeOpacity="0.85"
        />
      </g>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M22 7l-10 6L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="3" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 10-16 0" />
    </svg>
  );
}

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex justify-center">
      <div className="flex flex-col min-h-dvh w-full max-w-[480px] safe-top safe-bottom">
        {/* Top decorative shapes */}
        <div className="absolute top-0 left-0 w-full h-64 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/[0.07]" />
          <div className="absolute -top-10 -left-16 w-48 h-48 rounded-full bg-indigo-500/[0.05]" />
        </div>

        {/* Logo + Header */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-2 relative z-10">
          <div className="mb-5 drop-shadow-lg">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ReelRecipe</h1>
          <p className="text-sm text-gray-400 mt-1.5 font-medium">
            {mode === "login" ? "Welcome back! Sign in to continue." : "Create your account to get started."}
          </p>
        </div>

        {/* Form Card */}
        <div className="px-5 pb-8 relative z-10">
          <div className="bg-white rounded-3xl shadow-[0_4px_32px_rgba(0,0,0,0.06)] border border-gray-100 p-6">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                               placeholder:text-gray-400 transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                             placeholder:text-gray-400 transition-all"
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                             placeholder:text-gray-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600
                           text-white font-semibold rounded-2xl text-sm shadow-lg shadow-blue-500/25
                           active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
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

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Toggle */}
            <p className="text-center text-sm text-gray-500">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                }}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-5">
            Extract recipes from TikTok, Instagram & YouTube
          </p>
        </div>
      </div>
    </div>
  );
}

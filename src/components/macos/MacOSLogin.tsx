"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowRight, KeyRound, AlertCircle, RefreshCw } from "lucide-react";
import { GalleryLogo } from "./MacOSIcons";

export default function MacOSLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Smooth login redirect
      window.location.href = "/archive";
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between select-none overflow-hidden bg-[#f8fafc] font-sans antialiased text-slate-900">
      {/* Background: Clean Soft Ambient Light Mesh (No hardcoded dark images) */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(219,234,254,0.7),rgba(255,255,255,0))]" />

      {/* Top Status Bar */}
      <header className="relative z-10 flex h-10 items-center justify-between px-6 text-xs font-medium text-slate-600 select-none">
        <div className="flex items-center space-x-2.5">
          <GalleryLogo className="h-4 w-4 text-slate-900" />
          <span className="font-semibold text-slate-900">The Gallery</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-500">
          <span className="text-[11px] font-mono">Vault Protected</span>
          <span>{timeString || "Wed Sep 16"}</span>
        </div>
      </header>

      {/* Center: Clean White Card */}
      <main className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
        {/* User Avatar Bubble */}
        <div className="relative mb-5 flex h-22 w-22 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-lg">
          <GalleryLogo className="h-10 w-10 text-slate-900" />
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white border-2 border-white shadow-sm">
            <Lock className="h-3 w-3" />
          </div>
        </div>

        {/* User Name & Vault Badge */}
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          The Gallery
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Private Digital Archive
        </p>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-6 w-full max-w-xs space-y-3">
          {/* Email Input */}
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-slate-400 focus:outline-none transition"
            />
          </div>

          {/* Password with Arrow Button */}
          <div className="relative flex items-center">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-10 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-slate-400 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition disabled:opacity-50 shadow-xs"
            >
              {loading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center justify-center rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-700">
              <AlertCircle className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Google Sign-in Option */}
        <div className="mt-3 w-full max-w-xs">
          <Link
            href="/auth/google"
            className="flex w-full items-center justify-center space-x-2.5 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </Link>
        </div>

        <p className="mt-3 text-[11px] text-slate-400">
          Unlock with Master Admin or Google Identity
        </p>
      </main>

      {/* Bottom Actions: Redeem Key & Request Entry */}
      <footer className="relative z-10 flex items-center justify-center space-x-4 pb-8 text-xs font-medium text-slate-600">
        <Link
          href="/register"
          className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
        >
          <KeyRound className="mr-2 h-4 w-4 text-slate-700" />
          <span>Redeem Invite Key</span>
        </Link>
        <Link
          href="/request-access"
          className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
        >
          <span>Request Access</span>
        </Link>
      </footer>
    </div>
  );
}

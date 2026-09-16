"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowRight, KeyRound, UserCheck, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { AppleLogo } from "./MacOSIcons";

export default function MacOSLogin() {
  const [email, setEmail] = useState("admin@autisticjourney.local");
  const [password, setPassword] = useState("AdminMaster2026!");
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
    <div className="relative min-h-screen w-full flex flex-col justify-between select-none overflow-hidden bg-black font-sans antialiased text-white">
      {/* Background: macOS Tahoe Retina Wallpaper with subtle depth */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: "url('/macos/tahoe-wallpaper-dark.webp')" }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />
      </div>

      {/* Top macOS Status Bar */}
      <header className="relative z-10 flex h-9 items-center justify-between px-4 text-xs font-medium text-white/80 select-none">
        <div className="flex items-center space-x-3">
          <AppleLogo className="h-4 w-4 fill-white" />
          <span className="font-semibold text-white">Autistic Journey</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-mono text-zinc-400">Vault Protected</span>
          <span>{timeString || "Wed Sep 16"}</span>
        </div>
      </header>

      {/* Center: macOS Tahoe User Unlock Card */}
      <main className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
        {/* User Avatar Bubble */}
        <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-2xl backdrop-blur-2xl">
          <span className="text-3xl font-bold tracking-tight text-white">
            AJ
          </span>
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-black border-2 border-black shadow-md">
            <Lock className="h-3 w-3" />
          </div>
        </div>

        {/* User Name & Vault Badge */}
        <h2 className="text-xl font-bold tracking-tight text-white">
          Chief Archivist
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5 font-mono">
          Class of 2026 • Private Community Vault
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
              placeholder="College email address"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-zinc-500 shadow-inner backdrop-blur-md focus:border-white/40 focus:outline-none transition"
            />
          </div>

          {/* Password Pill with Arrow Button */}
          <div className="relative flex items-center">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full rounded-xl border border-white/15 bg-white/5 py-2 pl-3.5 pr-10 text-xs text-white placeholder-zinc-500 shadow-inner backdrop-blur-md focus:border-white/40 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-white text-black hover:bg-zinc-200 active:scale-95 transition disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center justify-center rounded-xl bg-white/10 border border-white/20 px-3 py-1.5 text-[11px] text-zinc-200">
              <AlertCircle className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        <p className="mt-3 text-[11px] text-zinc-500">
          Press Return or click Arrow to unlock archive
        </p>
      </main>

      {/* Bottom Actions: Redeem Key & Request Entry */}
      <footer className="relative z-10 flex items-center justify-center space-x-6 pb-8 text-xs font-medium text-white/80">
        <Link
          href="/register"
          className="flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-md hover:bg-white/10 hover:text-white transition shadow-lg"
        >
          <KeyRound className="mr-2 h-4 w-4 text-white" />
          <span>Redeem Invite Key</span>
        </Link>
        <Link
          href="/request-access"
          className="flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-md hover:bg-white/10 hover:text-white transition shadow-lg"
        >
          <UserCheck className="mr-2 h-4 w-4 text-white" />
          <span>Request Entry</span>
        </Link>
      </footer>
    </div>
  );
}

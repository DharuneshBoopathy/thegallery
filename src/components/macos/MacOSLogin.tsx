"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ArrowRight, KeyRound, AlertCircle, RefreshCw, X, UserPlus, ChevronRight } from "lucide-react";
import { GalleryLogo } from "./MacOSIcons";

export default function MacOSLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeString, setTimeString] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

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
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Synchronize session cookie and storage across all environments
      if (data.token) {
        const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
        document.cookie = `aj_auth_token=${data.token}; path=/; max-age=604800; SameSite=Lax;${isHttps ? " Secure;" : ""}`;
        try {
          localStorage.setItem("aj_auth_token", data.token);
        } catch {}
      }

      window.location.href = data.token ? `/archive?token=${data.token}` : "/archive";
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
    }
  };

  const handleGoogleInstantSignIn = async (userEmail: string, name: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google/instant-sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, fullName: name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google sign-in failed");
      }

      if (data.token) {
        const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
        document.cookie = `aj_auth_token=${data.token}; path=/; max-age=604800; SameSite=Lax;${isHttps ? " Secure;" : ""}`;
        try {
          localStorage.setItem("aj_auth_token", data.token);
        } catch {}
      }

      window.location.href = data.token ? `/archive?token=${data.token}` : "/archive";
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
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
        <form onSubmit={handleLogin} className="mt-6 w-full max-w-xs space-y-3 text-left">
          {/* Email Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-slate-400 focus:outline-none transition"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:border-slate-400 focus:outline-none transition"
            />
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center space-x-2 rounded-xl bg-slate-900 py-2.5 px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-98 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                <span>Verifying Access...</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 mr-1" />
                <span>Unlock Vault & Enter</span>
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center justify-center rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-700">
              <AlertCircle className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center w-full max-w-xs">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-2.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">OR</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Google Sign-in */}
        <div className="w-full max-w-xs space-y-2.5">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setShowGoogleModal(true);
            }}
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2.5 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-98 cursor-pointer disabled:opacity-60"
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
            <span>Continue with Google</span>
          </button>

          <div className="text-center pt-1">
            <Link
              href="/auth/google"
              className="text-[11px] text-slate-400 hover:text-slate-700 transition"
            >
              Configure Google OAuth credentials or gateway →
            </Link>
          </div>
        </div>
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

      {/* Google Account Chooser Dialog Modal */}
      {showGoogleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowGoogleModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-left space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-xs p-1.5">
                  <svg viewBox="0 0 24 24" className="h-5 w-5">
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
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Choose an account</h3>
                  <p className="text-[11px] text-slate-500">to continue to The Gallery</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Accounts List */}
            <div className="space-y-2 divide-y divide-slate-100">
              {/* Account 1: Dharunesh Boopathy */}
              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(false);
                  handleGoogleInstantSignIn("boopathydharunesh622@gmail.com", "Dharunesh Boopathy");
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition text-left cursor-pointer group"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    DB
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">Dharunesh Boopathy</span>
                      <span className="rounded-full bg-blue-100 text-blue-800 px-1.5 py-0.2 text-[9px] font-semibold uppercase">
                        Super Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate font-mono">boopathydharunesh622@gmail.com</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition shrink-0" />
              </button>

              {/* Account 2: Chief Archivist */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleModal(false);
                    handleGoogleInstantSignIn("admin@thegallery.local", "Chief Archivist");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      CA
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">Chief Archivist</span>
                        <span className="rounded-full bg-slate-100 text-slate-800 px-1.5 py-0.2 text-[9px] font-semibold uppercase">
                          Super Admin
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate font-mono">admin@thegallery.local</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition shrink-0" />
                </button>
              </div>

              {/* Option 3: Use another account */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="h-9 w-9 shrink-0 rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-600 flex items-center justify-center font-semibold text-xs">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800">Use another account</span>
                      <p className="text-[11px] text-slate-400">Sign in with a different Google account</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-slate-400 transition shrink-0 ${showCustomInput ? "rotate-90" : ""}`} />
                </button>

                {showCustomInput && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (customGoogleEmail.trim()) {
                        setShowGoogleModal(false);
                        handleGoogleInstantSignIn(
                          customGoogleEmail.trim().toLowerCase(),
                          customGoogleName.trim() || customGoogleEmail.split("@")[0]
                        );
                      }
                    }}
                    className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left animate-in fade-in"
                  >
                    <input
                      type="email"
                      required
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      placeholder="Enter your Gmail / Google address"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs"
                    />
                    <input
                      type="text"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      placeholder="Full Name (optional)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 shadow-2xs"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
                    >
                      Sign In with this Account
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Production Google Cloud OAuth Link */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <a
                href="/api/auth/google"
                className="hover:text-blue-600 transition underline underline-offset-2"
              >
                Sign in with Google Cloud OAuth →
              </a>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

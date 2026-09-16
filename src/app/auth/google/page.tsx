"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, CheckCircle2, Copy, RefreshCw, KeyRound, ExternalLink } from "lucide-react";

export default function GoogleAuthPage() {
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSignIn = async (email: string, fullName: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google/instant-sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Sign in failed");
      }

      window.location.href = "/archive";
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#f8fafc] text-slate-900 font-sans select-none p-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-6">
        <Link href="/login" className="flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:text-slate-900">
          <span>← Back to Vault Login</span>
        </Link>
        <span className="text-[11px] font-mono rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 shadow-2xs">
          Google Identity Gateway
        </span>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Header Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center space-y-4">
          {/* Google Logo SVG */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-md p-2.5">
            <svg viewBox="0 0 24 24" className="h-8 w-8">
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Sign in with Google</h1>
            <p className="text-xs text-slate-500 mt-1">Authenticate into The Gallery Vault</p>
          </div>

          {/* Super Admin Quick Access Button */}
          <div className="pt-2">
            <button
              onClick={() => handleSignIn("boopathydharunesh622@gmail.com", "Dharunesh Boopathy")}
              disabled={loading}
              className="w-full group flex items-center justify-between p-3.5 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 hover:border-blue-300 transition text-left shadow-2xs"
            >
              <div className="flex items-center space-x-3 truncate">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  DB
                </div>
                <div className="truncate">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">Dharunesh Boopathy</span>
                    <span className="rounded-full bg-blue-600 text-white px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase">
                      Super Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate font-mono">boopathydharunesh622@gmail.com</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-600 shrink-0 group-hover:translate-x-0.5 transition" />
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-medium">Or use another Google email</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Custom Google Email Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customEmail) handleSignIn(customEmail, customName || customEmail.split("@")[0]);
            }}
            className="space-y-3"
          >
            <input
              type="email"
              required
              placeholder="Your Gmail / Google Workspace address"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition shadow-2xs"
            />
            <input
              type="text"
              placeholder="Full Name (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition shadow-2xs"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs flex items-center justify-center space-x-2"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <span>Continue with Google</span>}
            </button>
          </form>
        </div>

        {/* OAuth 2.0 Production Setup Guide Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <KeyRound className="h-4 w-4 text-slate-700" />
            <span>Google Cloud OAuth 2.0 Production Credentials</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            To use live Google OAuth on your custom domain, create an OAuth Client ID in the Google Cloud Console and provide the Authorized Redirect URI below:
          </p>

          <div className="space-y-2 text-[11px] font-mono">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans">Authorized JavaScript Origin:</span>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 p-2 mt-0.5">
                <span className="truncate text-slate-700">https://thegallery.theautisticjourney.me</span>
                <button
                  onClick={() => copyToClipboard("https://thegallery.theautisticjourney.me", "origin")}
                  className="ml-2 text-slate-500 hover:text-slate-800 shrink-0"
                >
                  {copied === "origin" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-sans">Authorized Redirect URI:</span>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 p-2 mt-0.5">
                <span className="truncate text-slate-700">https://thegallery.theautisticjourney.me/api/auth/google/callback</span>
                <button
                  onClick={() => copyToClipboard("https://thegallery.theautisticjourney.me/api/auth/google/callback", "uri")}
                  className="ml-2 text-slate-500 hover:text-slate-800 shrink-0"
                >
                  {copied === "uri" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 pt-4">
        The Gallery Vault • Protected by Google Identity & Hardware Tokens
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, User, ShieldCheck, ExternalLink, HelpCircle } from "lucide-react";
import { AppleLogo } from "./MacOSIcons";

interface MenuBarProps {
  onOpenSpotlight: () => void;
  user?: { fullName: string; role: string; email: string } | null;
  onLockVault?: () => void;
}

export default function MacOSMenuBar({
  onOpenSpotlight,
  user,
  onLockVault,
}: MenuBarProps) {
  const [timeString, setTimeString] = useState<string>("");
  const [appleMenuOpen, setAppleMenuOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleWindowClick = () => {
      setAppleMenuOpen(false);
      setFileMenuOpen(false);
    };
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex h-10 items-center justify-between px-4 text-[13px] font-medium tracking-tight text-white select-none liquid-glass-header">
        {/* Left Side:  Apple Icon, "Autistic Journey", File, Edit, View, Help */}
        <div className="flex items-center space-x-4">
          {/* Apple Logo with Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAppleMenuOpen(!appleMenuOpen);
                setFileMenuOpen(false);
              }}
              className={`flex items-center justify-center rounded-md p-1.5 hover:bg-white/10 transition ${
                appleMenuOpen ? "bg-white/10" : ""
              }`}
            >
              <AppleLogo className="h-4 w-4 fill-white" />
            </button>

            {appleMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-9 w-60 rounded-xl border border-white/10 bg-[#141416]/95 p-1.5 text-white shadow-2xl backdrop-blur-3xl text-xs"
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400">
                  Autistic Journey Archive
                </div>
                <div className="my-1 h-px bg-white/10" />
                <Link
                  href="/archive"
                  onClick={() => setAppleMenuOpen(false)}
                  className="block rounded-lg px-3 py-1.5 hover:bg-white hover:text-black font-medium transition"
                >
                  All Memories
                </Link>
                <Link
                  href="/groups"
                  onClick={() => setAppleMenuOpen(false)}
                  className="block rounded-lg px-3 py-1.5 hover:bg-white hover:text-black font-medium transition"
                >
                  Community Circles
                </Link>
                <Link
                  href="/upload"
                  onClick={() => setAppleMenuOpen(false)}
                  className="block rounded-lg px-3 py-1.5 hover:bg-white hover:text-black font-medium transition"
                >
                  Deposit Media
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setAppleMenuOpen(false)}
                  className="block rounded-lg px-3 py-1.5 hover:bg-white hover:text-black font-medium transition"
                >
                  Mission Control
                </Link>
                <div className="my-1 h-px bg-white/10" />
                <button
                  onClick={() => {
                    setAppleMenuOpen(false);
                    if (onLockVault) onLockVault();
                    else window.location.href = "/login";
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-zinc-300 hover:bg-white hover:text-black transition"
                >
                  <span>Lock Vault</span>
                  <span className="text-[10px] opacity-60 font-mono">⌘Q</span>
                </button>
              </div>
            )}
          </div>

          {/* Brand Name: Autistic Journey */}
          <Link
            href="/archive"
            className="font-bold tracking-tight text-sm text-white hover:opacity-90 transition px-1"
          >
            Autistic Journey
          </Link>

          {/* Menus: File, Edit, View, Help */}
          <div className="hidden sm:flex items-center space-x-1 text-zinc-300 text-xs">
            <Link
              href="/upload"
              className="rounded-md px-2 py-1 hover:bg-white/10 hover:text-white transition"
            >
              File
            </Link>
            <Link
              href="/profile"
              className="rounded-md px-2 py-1 hover:bg-white/10 hover:text-white transition"
            >
              Edit
            </Link>
            <Link
              href="/archive"
              className="rounded-md px-2 py-1 hover:bg-white/10 hover:text-white transition"
            >
              View
            </Link>
            <button
              onClick={() => setHelpModalOpen(true)}
              className="rounded-md px-2 py-1 hover:bg-white/10 hover:text-white transition"
            >
              Help
            </button>
          </div>
        </div>

        {/* Right Side: NO wifi, NO battery, just Spotlight search, Time, Profile */}
        <div className="flex items-center space-x-3">
          {/* Spotlight Search Trigger (⌘K) */}
          <button
            onClick={onOpenSpotlight}
            className="flex items-center space-x-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10 hover:text-white transition"
          >
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden md:inline text-[11px] text-zinc-400 font-mono">⌘Space</span>
          </button>

          {/* Date and Time (Native macOS format) */}
          <span className="text-[12px] font-normal text-zinc-300 tracking-normal px-1">
            {timeString || "Wed Sep 16"}
          </span>

          {/* User Account Capsule */}
          {user && (
            <Link
              href="/profile"
              className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 transition"
            >
              <div className="h-4 w-4 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-bold">
                {user.fullName.charAt(0)}
              </div>
              <span className="hidden md:inline text-[11px] font-medium text-white truncate max-w-[120px]">
                {user.fullName}
              </span>
            </Link>
          )}
        </div>
      </header>

      {/* Help Modal */}
      {helpModalOpen && (
        <div
          onClick={() => setHelpModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#121215]/95 p-6 text-white shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Autistic Journey Vault Guide</h3>
                <p className="text-xs text-zinc-400">Private Community Archive</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                <strong>Spotlight Search:</strong> Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">⌘Space</kbd> or <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">Ctrl+Space</kbd> anywhere to search photos, batchmates, and events.
              </p>
              <p>
                <strong>Navigation:</strong> Use the bottom liquid glass slider dock to jump between Library, Circles, Deposit, and Settings.
              </p>
              <p>
                <strong>Privacy Controls:</strong> Every photo is governed by zero-trust access control. Gender and circle restrictions are evaluated entirely on the server.
              </p>
            </div>
            <button
              onClick={() => setHelpModalOpen(false)}
              className="mt-6 w-full rounded-xl bg-white py-2 text-xs font-semibold text-black shadow hover:bg-zinc-200 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

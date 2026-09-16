"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, User, ShieldCheck, ExternalLink, HelpCircle } from "lucide-react";
import { GalleryLogo } from "./MacOSIcons";

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
  const [menuOpen, setMenuOpen] = useState(false);
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
      setMenuOpen(false);
      setFileMenuOpen(false);
    };
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex h-10 items-center justify-between px-4 text-[13px] font-medium tracking-tight text-slate-800 select-none liquid-glass-header">
        {/* Left Side: Logo, The Gallery, File, Edit, View, Help */}
        <div className="flex items-center space-x-3">
          {/* Gallery Logo with Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
                setFileMenuOpen(false);
              }}
              className={`flex items-center justify-center rounded-md p-1.5 hover:bg-slate-100 transition ${
                menuOpen ? "bg-slate-100" : ""
              }`}
            >
              <GalleryLogo className="h-4 w-4 text-slate-900" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-9 w-60 rounded-xl border border-slate-200 bg-white/95 p-1.5 text-slate-800 shadow-2xl backdrop-blur-3xl text-xs"
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-500">
                  The Gallery Archive
                </div>
                <div className="my-1 h-px bg-slate-100" />
                <Link
                  href="/archive"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-1.5 hover:bg-slate-100 font-medium transition"
                >
                  All Memories
                </Link>
                <Link
                  href="/groups"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-1.5 hover:bg-slate-100 font-medium transition"
                >
                  Community Circles
                </Link>
                <Link
                  href="/upload"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-1.5 hover:bg-slate-100 font-medium transition"
                >
                  Deposit Media
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-1.5 hover:bg-slate-100 font-medium transition"
                >
                  Mission Control
                </Link>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (onLockVault) onLockVault();
                    else window.location.href = "/login";
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
                >
                  <span>Lock Vault</span>
                  <span className="text-[10px] opacity-60 font-mono">⌘Q</span>
                </button>
              </div>
            )}
          </div>

          {/* Brand Name: The Gallery */}
          <Link
            href="/archive"
            className="font-bold tracking-tight text-sm text-slate-900 hover:opacity-80 transition px-1"
          >
            The Gallery
          </Link>

          {/* Menus: File, Edit, View, Help */}
          <div className="hidden sm:flex items-center space-x-1 text-slate-600 text-xs">
            <Link
              href="/upload"
              className="rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              File
            </Link>
            <Link
              href="/archive"
              className="rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              View
            </Link>
            <Link
              href="/groups"
              className="rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Circles
            </Link>
            <button
              onClick={() => setHelpModalOpen(true)}
              className="rounded-md px-2 py-1 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Help
            </button>
          </div>
        </div>

        {/* Right Side: Search, Status, Time */}
        <div className="flex items-center space-x-3 text-xs text-slate-600">
          {/* Spotlight Search Trigger */}
          <button
            onClick={onOpenSpotlight}
            title="Spotlight Search (⌘Space)"
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white/80 px-2.5 py-1 text-slate-500 hover:border-slate-300 hover:text-slate-800 transition shadow-xs"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline text-[11px]">Search...</span>
            <kbd className="hidden md:inline text-[10px] font-mono opacity-60">⌘Space</kbd>
          </button>

          {/* User Profile Pill */}
          <Link
            href="/profile"
            className="flex items-center space-x-1.5 rounded-lg px-2 py-1 hover:bg-slate-100 transition"
          >
            <User className="h-3.5 w-3.5 text-slate-600" />
            <span className="max-w-[120px] truncate text-[12px] font-medium text-slate-800">
              {user?.fullName || "Member"}
            </span>
          </Link>

          {/* Time & Date Display */}
          <div className="flex items-center space-x-1 font-mono text-[12px] text-slate-700">
            <span>{timeString || "Wed Sep 16"}</span>
          </div>
        </div>
      </header>

      {/* Help & Archive Guide Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <GalleryLogo className="h-5 w-5 text-slate-900" />
                <h3 className="text-base font-bold text-slate-900">The Gallery Vault Guide</h3>
              </div>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>The Gallery</strong> is a secure digital archive engineered for private, version-controlled preservation of community memories, photos, and high-definition video captures.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li><strong>All Memories:</strong> Infinite stream of authorized photographs and videos.</li>
                <li><strong>Community Circles:</strong> Dedicated group spaces with private media vaults.</li>
                <li><strong>Deposit Media:</strong> Direct, lossless ingestion with automatic WebP derivatives and Git commits.</li>
                <li><strong>Spotlight:</strong> Press <kbd className="rounded bg-slate-100 px-1 font-mono text-[11px]">⌘Space</kbd> anywhere to search.</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setHelpModalOpen(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

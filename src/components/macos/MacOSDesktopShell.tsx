"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Image,
  Users,
  UploadCloud,
  Shield,
  KeyRound,
  Calendar,
  Sparkles,
  Sidebar as SidebarIcon,
  ChevronRight,
} from "lucide-react";
import MacOSMenuBar from "./MacOSMenuBar";
import MacOSDock from "./MacOSDock";
import MacOSSpotlight from "./MacOSSpotlight";

interface MacOSDesktopShellProps {
  appName: string;
  windowTitle: string;
  user?: { fullName: string; role: string; email: string } | null;
  children: React.ReactNode;
}

export default function MacOSDesktopShell({
  appName,
  windowTitle,
  user,
  children,
}: MacOSDesktopShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const handleLockVault = async () => {
    try {
      await fetch("/api/auth/me", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] text-white flex flex-col font-sans antialiased select-none">
      {/* Top macOS Tahoe Liquid Glass Bar */}
      <MacOSMenuBar
        user={user}
        onOpenSpotlight={() => setSpotlightOpen(true)}
        onLockVault={handleLockVault}
      />

      {/* Main Full-Bleed Webpage Body */}
      <div className="flex flex-1 pt-10 pb-24 min-h-screen">
        {/* Left macOS Sidebar (Photos / Finder Web Experience) */}
        {sidebarOpen && (
          <aside className="hidden md:flex w-64 flex-col justify-between shrink-0 liquid-glass-sidebar p-4 select-none sticky top-10 h-[calc(100vh-2.5rem)]">
            <div className="space-y-6">
              {/* Sidebar Header & Toggle */}
              <div className="flex items-center justify-between px-2 pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Navigation
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition"
                >
                  <SidebarIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Library Navigation */}
              <div>
                <nav className="space-y-1">
                  <Link
                    href="/archive"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                      pathname === "/archive"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center">
                      <Image className="mr-2.5 h-4 w-4" />
                      All Memories
                    </span>
                  </Link>
                  <Link
                    href="/groups"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                      pathname === "/groups"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center">
                      <Users className="mr-2.5 h-4 w-4" />
                      Community Circles
                    </span>
                  </Link>
                  <Link
                    href="/upload"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                      pathname === "/upload"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center">
                      <UploadCloud className="mr-2.5 h-4 w-4" />
                      Deposit Media
                    </span>
                  </Link>
                </nav>
              </div>

              {/* Collections & Events */}
              <div>
                <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Batches & Eras
                </div>
                <nav className="space-y-1 text-xs text-zinc-300">
                  <Link
                    href="/archive"
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/5 hover:text-white transition"
                  >
                    <span className="flex items-center">
                      <Calendar className="mr-2.5 h-3.5 w-3.5 text-zinc-400" />
                      Class of 2026
                    </span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                      Vault
                    </span>
                  </Link>
                  <Link
                    href="/archive"
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/5 hover:text-white transition"
                  >
                    <span className="flex items-center">
                      <Sparkles className="mr-2.5 h-3.5 w-3.5 text-zinc-400" />
                      Campus & Fest
                    </span>
                  </Link>
                </nav>
              </div>

              {/* Administration Section */}
              {isAdmin && (
                <div>
                  <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Governance
                  </div>
                  <nav className="space-y-1 text-xs">
                    <Link
                      href="/admin"
                      className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${
                        pathname === "/admin"
                          ? "bg-white text-black font-semibold shadow-sm"
                          : "text-zinc-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center">
                        <Shield className="mr-2.5 h-4 w-4" />
                        Mission Control
                      </span>
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-zinc-300 hover:bg-white/10 hover:text-white transition"
                    >
                      <span className="flex items-center">
                        <KeyRound className="mr-2.5 h-4 w-4" />
                        Invite Keys
                      </span>
                    </Link>
                  </nav>
                </div>
              )}
            </div>

            {/* Sidebar Footer Vault Status */}
            <div className="pt-4 border-t border-white/10 text-[11px] text-zinc-400 space-y-2">
              <div className="flex items-center justify-between">
                <span>Vault Security</span>
                <span className="text-white font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded-full">
                  SEALED
                </span>
              </div>
              <div className="text-[10px] text-zinc-400">
                End-to-End Authenticated Vault
              </div>
            </div>
          </aside>
        )}

        {/* Collapsed Sidebar Restore Tab */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hidden md:flex fixed left-3 top-14 z-30 items-center justify-center rounded-lg border border-white/10 bg-black/60 p-2 text-zinc-300 hover:text-white backdrop-blur-md shadow-lg"
          >
            <SidebarIcon className="h-4 w-4" />
          </button>
        )}

        {/* Main Full-Width Webpage Content View */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Bottom Floating Liquid Glass Dock Pill */}
      <MacOSDock isAdmin={isAdmin} />

      {/* Global Spotlight Search Modal */}
      <MacOSSpotlight
        isOpen={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
      />
    </div>
  );
}

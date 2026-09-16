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
  Sidebar as SidebarIcon,
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
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased select-none">
      {/* Top Menu Bar */}
      <MacOSMenuBar
        user={user}
        onOpenSpotlight={() => setSpotlightOpen(true)}
        onLockVault={handleLockVault}
      />

      {/* Main Full-Bleed Webpage Body */}
      <div className="flex flex-1 pt-10 pb-24 min-h-screen">
        {/* Left Sidebar */}
        {sidebarOpen && (
          <aside className="hidden md:flex w-64 flex-col justify-between shrink-0 liquid-glass-sidebar p-4 select-none sticky top-10 h-[calc(100vh-2.5rem)]">
            <div className="space-y-6">
              {/* Sidebar Header & Toggle */}
              <div className="flex items-center justify-between px-2 pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Navigation
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
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
                        ? "bg-slate-900 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span className="flex items-center">
                      <Image className="mr-2.5 h-4 w-4" />
                      All Memories
                    </span>
                  </Link>

                  <Link
                    href="/upload"
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                      pathname === "/upload"
                        ? "bg-slate-900 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <span className="flex items-center">
                      <UploadCloud className="mr-2.5 h-4 w-4" />
                      Deposit Media
                    </span>
                  </Link>
                </nav>
              </div>

              {/* Administration Section */}
              {isAdmin && (
                <div>
                  <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Governance
                  </div>
                  <nav className="space-y-1 text-xs">
                    <Link
                      href="/admin"
                      className={`flex items-center justify-between rounded-xl px-3 py-2 transition ${
                        pathname === "/admin"
                          ? "bg-slate-900 text-white font-semibold shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center">
                        <Shield className="mr-2.5 h-4 w-4" />
                        Mission Control
                      </span>
                    </Link>
                  </nav>
                </div>
              )}
            </div>

            {/* Bottom Quick Links */}
            <div className="border-t border-slate-200/80 pt-3 space-y-1 text-xs">
              <Link
                href="/register"
                className="flex items-center rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <KeyRound className="mr-2.5 h-4 w-4 text-slate-400" />
                <span>Invite Codes</span>
              </Link>
            </div>
          </aside>
        )}

        {/* Dynamic Main Stage Viewport */}
        <main className="flex-1 overflow-x-hidden px-4 md:px-8 pt-4">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mb-4 flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-xs hover:bg-slate-50 transition"
            >
              <SidebarIcon className="h-3.5 w-3.5" />
              <span>Show Sidebar</span>
            </button>
          )}

          {children}
        </main>
      </div>

      {/* Floating Bottom Dock */}
      <MacOSDock isAdmin={isAdmin} />

      {/* Spotlight Search Overlay */}
      {spotlightOpen && (
        <MacOSSpotlight isOpen={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
      )}
    </div>
  );
}

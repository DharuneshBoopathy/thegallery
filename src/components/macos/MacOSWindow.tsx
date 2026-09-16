"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Sidebar,
  Image,
  Film,
  Users,
  UploadCloud,
  Shield,
  KeyRound,
  Trash2,
  Calendar,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { PhotosAppIcon } from "./MacOSIcons";

interface MacOSWindowProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  user?: { fullName: string; role: string } | null;
}

export default function MacOSWindow({
  title,
  subtitle = "Autistic Journey",
  children,
  user,
}: MacOSWindowProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-8 z-30 animate-bounce">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-2 rounded-xl border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl hover:bg-black/80"
        >
          <PhotosAppIcon className="h-5 w-5" />
          <span>Restore {title}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto flex flex-col transition-all duration-300 select-none ${
        isFullscreen
          ? "fixed inset-0 top-7 z-30 rounded-none border-none"
          : "relative z-20 w-full max-w-7xl rounded-2xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.7)]"
      } overflow-hidden bg-[#0d1017]/90 backdrop-blur-3xl text-white`}
    >
      {/* macOS Window Titlebar & Toolbar */}
      <div className="flex h-13 items-center justify-between px-4 border-b border-white/10 bg-gradient-to-b from-white/10 to-transparent">
        {/* Left: Traffic Lights & Navigation */}
        <div className="flex items-center space-x-4">
          {/* Traffic Lights */}
          <div className="flex items-center space-x-2 group">
            {/* Close 🔴 */}
            <button
              onClick={() => window.history.back()}
              title="Close"
              className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f56] border border-[#e0443e] hover:opacity-90 active:opacity-75"
            >
              <span className="text-[9px] font-bold text-[#4c0002] opacity-0 group-hover:opacity-100">
                ×
              </span>
            </button>
            {/* Minimize 🟡 */}
            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize"
              className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ffbd2e] border border-[#dea123] hover:opacity-90 active:opacity-75"
            >
              <span className="text-[9px] font-bold text-[#5c3c00] opacity-0 group-hover:opacity-100 leading-none">
                -
              </span>
            </button>
            {/* Fullscreen / Maximize 🟢 */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="flex h-3 w-3 items-center justify-center rounded-full bg-[#27c93f] border border-[#1aab29] hover:opacity-90 active:opacity-75"
            >
              <span className="text-[7px] font-bold text-[#004d11] opacity-0 group-hover:opacity-100 leading-none">
                +
              </span>
            </button>
          </div>

          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
            className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <Sidebar className="h-4 w-4" />
          </button>

          {/* Back/Forward Browser Buttons */}
          <div className="hidden sm:flex items-center space-x-0.5">
            <button
              onClick={() => window.history.back()}
              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.history.forward()}
              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center: Segmented Navigation Control */}
        <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-0.5 text-xs font-medium text-slate-300">
          <Link
            href="/archive"
            className={`flex items-center rounded-md px-3 py-1 transition ${
              pathname === "/archive"
                ? "bg-white/20 text-white shadow-sm font-semibold"
                : "hover:text-white"
            }`}
          >
            <Image className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
            <span>Library</span>
          </Link>
          <Link
            href="/groups"
            className={`flex items-center rounded-md px-3 py-1 transition ${
              pathname === "/groups"
                ? "bg-white/20 text-white shadow-sm font-semibold"
                : "hover:text-white"
            }`}
          >
            <Users className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
            <span>Circles</span>
          </Link>
          <Link
            href="/upload"
            className={`flex items-center rounded-md px-3 py-1 transition ${
              pathname === "/upload"
                ? "bg-white/20 text-white shadow-sm font-semibold"
                : "hover:text-white"
            }`}
          >
            <UploadCloud className="mr-1.5 h-3.5 w-3.5 text-yellow-400" />
            <span>Deposit</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center rounded-md px-3 py-1 transition ${
                pathname === "/admin"
                  ? "bg-white/20 text-white shadow-sm font-semibold"
                  : "hover:text-white"
              }`}
            >
              <Shield className="mr-1.5 h-3.5 w-3.5 text-purple-400" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Right: Window Title / Mode */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline text-xs font-medium text-slate-300">
            {title}
          </span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Body Split: Sidebar + Content */}
      <div className="flex flex-1 min-h-[600px] overflow-hidden">
        {/* macOS Native Sidebar */}
        {sidebarOpen && (
          <aside className="w-56 shrink-0 border-r border-white/10 bg-black/30 p-3 space-y-4 text-xs select-none">
            {/* Library Section */}
            <div>
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Library
              </div>
              <nav className="space-y-0.5">
                <Link
                  href="/archive"
                  className={`flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 transition ${
                    pathname === "/archive"
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Image className="h-4 w-4 text-indigo-400" />
                  <span>All Memories</span>
                </Link>
                <Link
                  href="/groups"
                  className={`flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 transition ${
                    pathname === "/groups"
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span>Community Circles</span>
                </Link>
                <Link
                  href="/upload"
                  className={`flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 transition ${
                    pathname === "/upload"
                      ? "bg-indigo-600 text-white font-medium shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <UploadCloud className="h-4 w-4 text-yellow-400" />
                  <span>Deposit Media</span>
                </Link>
              </nav>
            </div>

            {/* College Collections */}
            <div>
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Collections
              </div>
              <nav className="space-y-0.5 text-slate-300">
                <div className="flex items-center justify-between rounded-lg px-2.5 py-1 hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center">
                    <Calendar className="mr-2 h-3.5 w-3.5 text-indigo-400" /> Class of 2026
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                    Vault
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg px-2.5 py-1 hover:bg-white/5 cursor-pointer">
                  <span className="flex items-center">
                    <Sparkles className="mr-2 h-3.5 w-3.5 text-amber-400" /> Freshers & Fest
                  </span>
                </div>
              </nav>
            </div>

            {/* Administration Section */}
            {isAdmin && (
              <div>
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Administration
                </div>
                <nav className="space-y-0.5">
                  <Link
                    href="/admin"
                    className={`flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 transition ${
                      pathname === "/admin"
                        ? "bg-indigo-600 text-white font-medium shadow-sm"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Shield className="h-4 w-4 text-purple-400" />
                    <span>Mission Control</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <KeyRound className="h-4 w-4 text-yellow-400" />
                    <span>Invite Key Portal</span>
                  </Link>
                </nav>
              </div>
            )}

            {/* Vault Storage Status in Sidebar Footer */}
            <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 space-y-1 px-1">
              <div className="flex justify-between">
                <span>Vault Status</span>
                <span className="text-emerald-400 font-mono">SEALED</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              </div>
            </div>
          </aside>
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

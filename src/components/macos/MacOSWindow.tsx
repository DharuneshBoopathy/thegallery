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
  subtitle = "The Gallery",
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
          className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-xl hover:bg-slate-50 transition"
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
          ? "fixed inset-0 top-10 z-30 rounded-none border-none"
          : "relative z-20 w-full max-w-7xl rounded-2xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
      } overflow-hidden bg-white text-slate-900`}
    >
      {/* Window Titlebar & Toolbar */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-slate-200 bg-slate-50/80">
        {/* Left: Traffic Lights & Navigation */}
        <div className="flex items-center space-x-4">
          {/* Traffic Lights */}
          <div className="flex items-center space-x-2 group">
            {/* Close */}
            <button
              onClick={() => window.history.back()}
              title="Close"
              className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f56] border border-[#e0443e] hover:opacity-90 active:opacity-75"
            >
              <span className="text-[9px] font-bold text-[#4c0002] opacity-0 group-hover:opacity-100">
                ×
              </span>
            </button>
            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize"
              className="flex h-3 w-3 items-center justify-center rounded-full bg-[#ffbd2e] border border-[#dea123] hover:opacity-90 active:opacity-75"
            >
              <span className="text-[9px] font-bold text-[#5c3c00] opacity-0 group-hover:opacity-100 leading-none">
                -
              </span>
            </button>
            {/* Fullscreen */}
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
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <Sidebar className="h-4 w-4" />
          </button>

          {/* Back/Forward Browser Buttons */}
          <div className="hidden sm:flex items-center space-x-0.5">
            <button
              onClick={() => window.history.back()}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.history.forward()}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center: Segmented Navigation Control */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
          <Link
            href="/archive"
            className={`rounded-md px-3 py-1 transition ${
              pathname === "/archive"
                ? "bg-white text-slate-900 font-semibold shadow-xs"
                : "hover:text-slate-900"
            }`}
          >
            Memories
          </Link>
          <Link
            href="/groups"
            className={`rounded-md px-3 py-1 transition ${
              pathname === "/groups"
                ? "bg-white text-slate-900 font-semibold shadow-xs"
                : "hover:text-slate-900"
            }`}
          >
            Circles
          </Link>
          <Link
            href="/upload"
            className={`rounded-md px-3 py-1 transition ${
              pathname === "/upload"
                ? "bg-white text-slate-900 font-semibold shadow-xs"
                : "hover:text-slate-900"
            }`}
          >
            Deposit
          </Link>
        </div>

        {/* Right: Actions and Fullscreen */}
        <div className="flex items-center space-x-2 text-slate-500 text-xs">
          <div className="hidden md:flex flex-col text-right">
            <span className="font-semibold text-slate-800 text-[11px] leading-tight">{title}</span>
            <span className="text-[10px] text-slate-400 font-mono leading-tight">{subtitle}</span>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded p-1 hover:bg-slate-200 hover:text-slate-800 transition"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex flex-1 overflow-hidden min-h-[580px]">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-56 shrink-0 border-r border-slate-200 bg-slate-50/70 p-3 flex flex-col justify-between text-xs select-none">
            <div className="space-y-4">
              {/* Library Navigation */}
              <nav className="space-y-1">
                <Link
                  href="/archive"
                  className={`flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 transition ${
                    pathname === "/archive"
                      ? "bg-slate-900 text-white font-medium shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Image className="h-4 w-4 text-indigo-500" />
                  <span>All Memories</span>
                </Link>
                <Link
                  href="/groups"
                  className={`flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 transition ${
                    pathname === "/groups"
                      ? "bg-slate-900 text-white font-medium shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Users className="h-4 w-4 text-emerald-500" />
                  <span>Community Circles</span>
                </Link>
                <Link
                  href="/upload"
                  className={`flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 transition ${
                    pathname === "/upload"
                      ? "bg-slate-900 text-white font-medium shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <UploadCloud className="h-4 w-4 text-amber-500" />
                  <span>Deposit Media</span>
                </Link>
              </nav>

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
                          ? "bg-slate-900 text-white font-medium shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Shield className="h-4 w-4 text-purple-500" />
                      <span>Mission Control</span>
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      <KeyRound className="h-4 w-4 text-amber-500" />
                      <span>Invite Key Portal</span>
                    </Link>
                  </nav>
                </div>
              )}
            </div>

            {/* Storage Status in Sidebar Footer */}
            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1 px-1">
              <div className="flex justify-between">
                <span>Vault Status</span>
                <span className="text-emerald-600 font-mono font-medium">PROTECTED</span>
              </div>
            </div>
          </aside>
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}

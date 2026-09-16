"use client";

import { Wifi, Moon, Sun, Volume2, ShieldCheck, HardDrive } from "lucide-react";

interface ControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
  wallpaperMode: "dark" | "light";
  onToggleWallpaper: () => void;
}

export default function MacOSControlCenter({
  isOpen,
  onClose,
  wallpaperMode,
  onToggleWallpaper,
}: ControlCenterProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-4 top-8 w-80 rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 text-slate-800 shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="grid grid-cols-2 gap-2.5">
          {/* Wi-Fi & Bluetooth Tile */}
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                <Wifi className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Wi-Fi</div>
                <div className="text-[10px] text-slate-500">Connected</div>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Vault Guard</div>
                <div className="text-[10px] text-emerald-600 font-medium">Protected</div>
              </div>
            </div>
          </div>

          {/* Theme Switcher Tile */}
          <button
            onClick={onToggleWallpaper}
            className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 hover:bg-slate-100/80 transition text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                <Sun className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-mono text-slate-400">Display</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">
                Light Mode
              </div>
              <div className="text-[10px] text-slate-500">Active</div>
            </div>
          </button>
        </div>

        {/* Display / Brightness Slider */}
        <div className="mt-2.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium text-slate-700">
            <span>Archive Display</span>
            <span className="font-mono text-[10px] text-slate-400">Optimal</span>
          </div>
          <div className="h-5 w-full rounded-full bg-slate-200 p-0.5 border border-slate-300/50 flex items-center">
            <div className="h-full w-[85%] rounded-full bg-slate-800" />
          </div>
        </div>

        {/* Sound / Volume Slider */}
        <div className="mt-2.5 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
            <span className="flex items-center">
              <Volume2 className="mr-1.5 h-3.5 w-3.5 text-indigo-600" /> Sound
            </span>
            <span className="font-mono text-[10px] text-slate-400">100%</span>
          </div>
          <div className="h-5 w-full rounded-full bg-slate-200 p-0.5 border border-slate-300/50 flex items-center">
            <div className="h-full w-[70%] rounded-full bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

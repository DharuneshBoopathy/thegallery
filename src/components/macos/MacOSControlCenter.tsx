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
        className="absolute right-4 top-8 w-80 rounded-2xl border border-white/20 bg-[#1e1e1e]/90 p-3.5 text-white shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="grid grid-cols-2 gap-2.5">
          {/* Wi-Fi & Bluetooth Tile */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white">
                <Wifi className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">Wi-Fi</div>
                <div className="text-[10px] text-slate-400">Campus Mesh 6E</div>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold">Vault Guard</div>
                <div className="text-[10px] text-emerald-400">Strict Zero-Trust</div>
              </div>
            </div>
          </div>

          {/* Wallpaper Theme Switcher Tile */}
          <button
            onClick={onToggleWallpaper}
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition text-left"
          >
            <div className="flex items-center justify-between w-full">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                wallpaperMode === "dark" ? "bg-purple-600 text-white" : "bg-amber-500 text-white"
              }`}>
                {wallpaperMode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <span className="text-[10px] font-mono text-slate-400">Tahoe 26</span>
            </div>
            <div>
              <div className="text-xs font-semibold">
                {wallpaperMode === "dark" ? "Dark Wallpaper" : "Light Wallpaper"}
              </div>
              <div className="text-[10px] text-slate-400">Click to toggle</div>
            </div>
          </button>
        </div>

        {/* Display / Brightness Slider */}
        <div className="mt-2.5 rounded-2xl border border-white/10 bg-white/5 p-3 space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium text-slate-300">
            <span>Archive Display</span>
            <span className="font-mono text-[10px] text-slate-400">Retina Pro</span>
          </div>
          <div className="h-5 w-full rounded-full bg-black/40 p-0.5 border border-white/10 flex items-center">
            <div className="h-full w-[85%] rounded-full bg-white/90" />
          </div>
        </div>

        {/* Sound / Volume Slider */}
        <div className="mt-2.5 rounded-2xl border border-white/10 bg-white/5 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
            <span className="flex items-center">
              <Volume2 className="mr-1.5 h-3.5 w-3.5 text-indigo-400" /> Sound
            </span>
            <span className="font-mono text-[10px] text-slate-400">Stereo</span>
          </div>
          <div className="h-5 w-full rounded-full bg-black/40 p-0.5 border border-white/10 flex items-center">
            <div className="h-full w-[70%] rounded-full bg-white/90" />
          </div>
        </div>
      </div>
    </div>
  );
}

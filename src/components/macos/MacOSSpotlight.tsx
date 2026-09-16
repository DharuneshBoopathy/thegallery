"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Image, User, Users, Tag, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface SpotlightProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MacOSSpotlight({ isOpen, onClose }: SpotlightProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Global ⌘Space shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === "Space") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-28 bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-[#1e1e1e]/90 shadow-2xl backdrop-blur-3xl"
      >
        {/* Search Input Field */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10">
          <Search className="mr-3 h-5 w-5 text-white shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Spotlight Search: memories, classmates, circles, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded p-1 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="ml-2 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
            ESC
          </span>
        </div>

        {/* Search Results Area */}
        <div className="max-h-96 overflow-y-auto p-2 text-xs">
          {loading ? (
            <div className="py-8 text-center text-zinc-400">
              Searching batch archive vault...
            </div>
          ) : query && results.length === 0 ? (
            <div className="py-8 text-center text-zinc-400">
              No matching records found in vault.
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Top Matches ({results.length})
              </div>
              {results.map((item, idx) => (
                <Link
                  key={item.id}
                  href="/archive"
                  onClick={onClose}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition ${
                    selectedIndex === idx
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-zinc-200 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    {item.isVideo ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white shrink-0">
                        <Image className="h-4 w-4" />
                      </div>
                    ) : (
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="h-8 w-8 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="truncate">
                      <p className="truncate font-medium text-xs">
                        {item.originalFilename}
                      </p>
                      <p className="text-[10px] opacity-75 truncate">
                        {[item.captureYear, item.locationName, item.uploader?.fullName]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-6 px-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Quick Vault Actions
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                <Link
                  href="/archive"
                  onClick={onClose}
                  className="flex items-center space-x-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10 hover:text-white transition"
                >
                  <Image className="h-4 w-4 text-white" />
                  <span>Browse Photos</span>
                </Link>
                <Link
                  href="/groups"
                  onClick={onClose}
                  className="flex items-center space-x-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10 hover:text-white transition"
                >
                  <Users className="h-4 w-4 text-white" />
                  <span>Community Circles</span>
                </Link>
                <Link
                  href="/upload"
                  onClick={onClose}
                  className="flex items-center space-x-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10 hover:text-white transition"
                >
                  <Search className="h-4 w-4 text-white" />
                  <span>Deposit Memories</span>
                </Link>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center space-x-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10 hover:text-white transition"
                >
                  <Tag className="h-4 w-4 text-white" />
                  <span>Mission Control</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

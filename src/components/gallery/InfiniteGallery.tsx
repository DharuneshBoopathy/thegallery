"use client";

import { useState, useEffect } from "react";
import MediaLightbox, { MediaItem } from "./MediaLightbox";
import { Film, Calendar, Camera, RefreshCw, Eye, Search, Clock } from "lucide-react";

export default function InfiniteGallery() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeType, setActiveType] = useState<"all" | "photos" | "videos">("all");
  const [activeYear, setActiveYear] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const timelineYears = ["ALL", "2026", "2025", "2024", "2023", "2022"];

  const fetchFeed = async (cursor?: string | null, type = activeType, year = activeYear, q = searchQuery) => {
    try {
      if (q.trim()) {
        const params = new URLSearchParams();
        params.set("q", q.trim());
        if (type !== "all") params.set("type", type);
        if (year !== "ALL") params.set("year", year);

        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        setItems(data.results || []);
        setNextCursor(null);
        return;
      }

      const params = new URLSearchParams();
      params.set("limit", "20");
      if (cursor) params.set("cursor", cursor);
      if (type !== "all") params.set("type", type);
      if (year !== "ALL") params.set("year", year);

      const res = await fetch(`/api/media?${params.toString()}`);
      const data = await res.json();

      if (cursor) {
        setItems((prev) => [...prev, ...data.items]);
      } else {
        setItems(data.items || []);
      }
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      console.error("Gallery fetch failed:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(() => {
      fetchFeed(null, activeType, activeYear, searchQuery);
    }, 250);
    return () => clearTimeout(debounce);
  }, [activeType, activeYear, searchQuery]);

  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchFeed(nextCursor, activeType, activeYear, searchQuery);
  };

  return (
    <div className="space-y-6">
      {/* Search and Discovery Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search memories by keyword, event, location, camera..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition backdrop-blur-md"
          />
        </div>

        {/* Timeline Navigator Year Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Clock className="mr-1 h-3.5 w-3.5 text-zinc-400 shrink-0" />
          {timelineYears.map((yr) => (
            <button
              key={yr}
              onClick={() => setActiveYear(yr)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition ${
                activeYear === yr
                  ? "bg-white text-black font-bold shadow-sm"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {yr === "ALL" ? "All Time" : yr}
            </button>
          ))}
        </div>
      </div>

      {/* Category and Type Filter Pills */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex space-x-1.5">
          {(["all", "photos", "videos"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`rounded-lg px-3 py-1 text-xs font-medium uppercase tracking-wider transition ${
                activeType === type
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <span className="text-xs text-zinc-500 font-mono">
          {items.length} {items.length === 1 ? "memory" : "memories"}
        </span>
      </div>

      {/* Masonry / Grid Container */}
      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500">
          Decrypting and assembling archive feed...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card p-12 text-center text-xs text-zinc-400">
          No media matches the selected view. Upload photos or videos to begin.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 transition duration-200 hover:border-white/30 hover:shadow-xl shadow-sm"
            >
              {/* Thumbnail Image */}
              <img
                src={item.thumbnailUrl}
                alt={item.originalFilename}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />

              {/* Video Indicator Overlay */}
              {item.isVideo && (
                <div className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md border border-white/10">
                  <Film className="h-3.5 w-3.5 text-white" />
                </div>
              )}

              {/* Hover Dark Vignette & Metadata */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 opacity-0 transition duration-200 group-hover:opacity-100">
                <p className="truncate text-xs font-semibold text-white">
                  {item.originalFilename}
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-300">
                  <span>{item.captureYear || "Archive"}</span>
                  <span className="flex items-center text-white font-medium">
                    <Eye className="mr-1 h-3 w-3" /> View
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Trigger */}
      {nextCursor && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-50 transition shadow-sm"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> Loading more memories...
              </>
            ) : (
              "Load Next Batch"
            )}
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <MediaLightbox
          items={items}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

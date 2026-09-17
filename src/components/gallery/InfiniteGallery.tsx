"use client";

import { useState, useEffect } from "react";
import MediaLightbox, { MediaItem } from "./MediaLightbox";
import {
  Film,
  Calendar,
  RefreshCw,
  Eye,
  Search,
  Clock,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";

export default function InfiniteGallery() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeType, setActiveType] = useState<"all" | "photos" | "videos">("all");
  const [activeYear, setActiveYear] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Exactly matching the metadata date span (2023 through 2026)
  const timelineYears = ["ALL", "2023", "2024", "2025", "2026"];

  const fetchFeed = async (
    cursor?: string | null,
    type = activeType,
    year = activeYear,
    sort = sortOrder,
    q = searchQuery
  ) => {
    try {
      if (q.trim()) {
        const params = new URLSearchParams();
        params.set("q", q.trim());
        if (type !== "all") params.set("type", type);
        if (year !== "ALL") params.set("year", year);

        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        setItems(data.results || []);
        setTotalCount(data.results?.length || 0);
        setNextCursor(null);
        return;
      }

      const params = new URLSearchParams();
      params.set("limit", "36");
      params.set("sort", sort);
      if (cursor) params.set("cursor", cursor);
      if (type !== "all") params.set("type", type);
      if (year !== "ALL") params.set("year", year);

      const res = await fetch(`/api/media?${params.toString()}`);
      const data = await res.json();

      if (cursor) {
        setItems((prev) => [...prev, ...(data.items || [])]);
      } else {
        setItems(data.items || []);
      }
      setTotalCount(data.total || 0);
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
      fetchFeed(null, activeType, activeYear, sortOrder, searchQuery);
    }, 200);
    return () => clearTimeout(debounce);
  }, [activeType, activeYear, sortOrder, searchQuery]);

  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchFeed(nextCursor, activeType, activeYear, sortOrder, searchQuery);
  };

  const formatDate = (isoStr?: string, fallbackYear?: number) => {
    if (!isoStr) return fallbackYear ? String(fallbackYear) : "Archive";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return fallbackYear ? String(fallbackYear) : "Archive";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Discovery Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search all 4,092 memories by filename or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none transition shadow-xs"
          />
        </div>

        {/* Timeline Navigator Year Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Clock className="mr-1 h-3.5 w-3.5 text-slate-400 shrink-0" />
          {timelineYears.map((yr) => (
            <button
              key={yr}
              onClick={() => setActiveYear(yr)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition ${
                activeYear === yr
                  ? "bg-slate-900 text-white font-bold shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs"
              }`}
            >
              {yr === "ALL" ? "All Time" : yr}
            </button>
          ))}
        </div>
      </div>

      {/* Category and Sort Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Type Filter Pills */}
        <div className="flex space-x-1.5">
          {(["all", "photos", "videos"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`rounded-lg px-3 py-1 text-xs font-medium uppercase tracking-wider transition ${
                activeType === type
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Sort Order Toggle & Total Count */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            title="Toggle Date Order"
          >
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            <span className="font-mono text-[11px]">
              {sortOrder === "asc" ? "Oldest First (Date ↗)" : "Newest First (Date ↘)"}
            </span>
          </button>

          <span className="text-xs text-slate-500 font-mono">
            {totalCount > 0 ? `${totalCount} memories` : `${items.length} memories`}
          </span>
        </div>
      </div>

      {/* Grid Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400 mb-3" />
          <span className="text-xs text-slate-500 font-mono">
            Loading consolidated archive in chronological date order...
          </span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 shadow-xs">
          No media matching filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition duration-200 hover:border-slate-400 hover:shadow-md shadow-xs"
            >
              {/* Thumbnail Image */}
              <img
                src={item.thumbnailUrl}
                alt={item.originalFilename}
                loading="lazy"
                draggable={false}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedOriginal) {
                    target.dataset.triedOriginal = "true";
                    target.src = item.originalUrl || item.thumbnailUrl;
                  }
                }}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />

              {/* Video Indicator Overlay */}
              {item.isVideo && (
                <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20">
                  <Film className="h-3 w-3 text-white" />
                </div>
              )}

              {/* Date Badge */}
              <div className="absolute top-2 left-2 rounded-md bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-mono font-medium text-white shadow-xs">
                {formatDate(item.capturedAt, item.captureYear)}
              </div>

              {/* Hover Vignette & Filename */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 opacity-0 transition duration-200 group-hover:opacity-100">
                <p className="truncate text-xs font-semibold text-white">
                  {item.originalFilename}
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-200">
                  <span className="font-mono text-[9px]">{item.capturedAt?.slice(0, 10)}</span>
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
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shadow-xs"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" /> Loading next batch...
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

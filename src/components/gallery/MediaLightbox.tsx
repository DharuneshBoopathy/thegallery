"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Calendar, Camera, User, Tag, Maximize2, ShieldCheck, Play, Pause, Volume2, VolumeX } from "lucide-react";

export interface PersonTagItem {
  id: string;
  name: string;
  boxX?: number;
  boxY?: number;
}

export interface MediaItem {
  id: string;
  originalFilename: string;
  mimeType: string;
  isVideo: boolean;
  capturedAt?: string;
  captureYear?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  deviceMake?: string;
  deviceModel?: string;
  uploader?: { id: string; fullName: string };
  thumbnailUrl: string;
  originalUrl: string;
  tags?: string[];
  personTags?: PersonTagItem[];
}

interface LightboxProps {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function MediaLightbox({ items, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagBox, setTagBox] = useState<{ x: number; y: number } | null>(null);
  const [localTags, setLocalTags] = useState<Record<string, PersonTagItem[]>>({});
  const [tagLoading, setTagLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const current = items[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setShowTagModal(false);
  }, [items.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setShowTagModal(false);
  }, [items.length]);

  // Touch swipe detection for mobile devices (TASK-906)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      // Swiped left -> Next
      handleNext();
    } else if (diff < -50) {
      // Swiped right -> Prev
      handlePrev();
    }
    setTouchStart(null);
  };

  // Keyboard navigation & Esc to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  // Prevent right-click context menu (anti-download deterrent)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showTagModal) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setTagBox({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) });
  };

  const handleSaveTag = async () => {
    if (!tagInput.trim()) return;
    setTagLoading(true);
    try {
      const res = await fetch("/api/media/tags/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: current.id,
          manualName: tagInput.trim(),
          boxX: tagBox?.x || 0.5,
          boxY: tagBox?.y || 0.5,
        }),
      });
      const data = await res.json();
      if (res.ok && data.personTag) {
        const newTag: PersonTagItem = {
          id: data.personTag.id,
          name: data.personTag.name,
          boxX: data.personTag.box?.x,
          boxY: data.personTag.box?.y,
        };
        setLocalTags((prev) => ({
          ...prev,
          [current.id]: [...(prev[current.id] || current.personTags || []), newTag],
        }));
        setTagInput("");
        setTagBox(null);
        setShowTagModal(false);
      }
    } catch (err) {
      console.error("Failed to tag person:", err);
    } finally {
      setTagLoading(false);
    }
  };

  const currentPersonTags = localTags[current.id] || current.personTags || [];

  return (
    <div
      onContextMenu={handleContextMenu}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-xl select-none"
    >
      {/* Top Controls Bar */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-black/40">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-slate-400">
            {currentIndex + 1} / {items.length}
          </span>
          <span className="h-3 w-px bg-white/20" />
          <p className="truncate text-xs font-medium text-slate-200 max-w-[150px] sm:max-w-sm">
            {current.originalFilename}
          </p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {!current.isVideo && (
            <button
              onClick={() => {
                setShowTagModal(!showTagModal);
                setTagBox(null);
              }}
              className={`flex items-center rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                showTagModal
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "bg-white/10 text-zinc-200 hover:bg-white/20 border border-white/10"
              }`}
            >
              <User className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tag Person</span>
            </button>
          )}

          <div className="hidden sm:flex items-center text-[11px] text-zinc-300">
            <ShieldCheck className="mr-1 h-3.5 w-3.5 text-white" /> Vault Protected
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Viewing Stage with Touch Swipe (TASK-906) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative flex flex-1 items-center justify-center p-2 sm:p-4 overflow-hidden"
      >
        {/* Navigation Arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-20 rounded-full bg-white/10 p-2.5 sm:p-3 text-white backdrop-blur-md hover:bg-white/20 transition border border-white/10"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-20 rounded-full bg-white/10 p-2.5 sm:p-3 text-white backdrop-blur-md hover:bg-white/20 transition border border-white/10"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* Media Content Display */}
        <div className="relative max-h-full max-w-full flex items-center justify-center pointer-events-auto">
          {current.isVideo ? (
            <div className="relative flex flex-col items-center">
              <video
                ref={videoRef}
                src={current.originalUrl}
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                className="max-h-[75vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain border border-white/10"
              />
              {/* Custom Player Toolbar */}
              <div className="mt-3 flex items-center space-x-3 rounded-full bg-black/70 px-4 py-1.5 backdrop-blur-md border border-white/15">
                <button onClick={togglePlay} className="p-1 text-white hover:opacity-80">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button onClick={toggleMute} className="p-1 text-white hover:opacity-80">
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                {current.durationSeconds && (
                  <span className="text-[10px] font-mono text-zinc-300">
                    {Math.round(current.durationSeconds)}s
                  </span>
                )}
              </div>

              {/* Dynamic Forensic Watermark Overlay */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 opacity-20 select-none">
                <div className="flex justify-between text-[11px] font-mono text-white/70">
                  <span>AUTISTIC JOURNEY ARCHIVE</span>
                  <span>{new Date().toISOString().split("T")[0]}</span>
                </div>
                <div className="self-center transform -rotate-12 text-sm font-mono tracking-widest text-white/50">
                  VIEWER SESSION CONFIDENTIAL
                </div>
                <div className="flex justify-between text-[10px] font-mono text-white/50">
                  <span>DO NOT DISTRIBUTE</span>
                  <span>AJ-SEC-FORENSIC</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={imageContainerRef}
              onClick={handleImageClick}
              className={`relative ${showTagModal ? "cursor-crosshair ring-2 ring-white/60 rounded-2xl" : ""}`}
            >
              <img
                src={current.originalUrl}
                alt={current.originalFilename}
                draggable={false}
                className="max-h-[75vh] sm:max-h-[80vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl transition duration-200 border border-white/10"
              />

              {/* Dynamic Person Tag Pins & Overlays */}
              {currentPersonTags.map((pt) => {
                if (pt.boxX === undefined || pt.boxY === undefined) return null;
                return (
                  <div
                    key={pt.id}
                    style={{ left: `${pt.boxX * 100}%`, top: `${pt.boxY * 100}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group pointer-events-auto z-30"
                  >
                    <div className="h-6 w-6 rounded-full border-2 border-white bg-white/30 backdrop-blur-sm animate-pulse" />
                    <span className="absolute left-1/2 -translate-x-1/2 top-7 whitespace-nowrap rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white shadow-lg border border-white/15">
                      {pt.name}
                    </span>
                  </div>
                );
              })}

              {/* Tagging Interactive Marker */}
              {showTagModal && tagBox && (
                <div
                  style={{ left: `${tagBox.x * 100}%`, top: `${tagBox.y * 100}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-40"
                >
                  <div className="h-8 w-8 rounded-full border-2 border-dashed border-white bg-white/20 animate-spin" />
                </div>
              )}

              {/* Dynamic Forensic Watermark Overlay */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 opacity-25 select-none">
                <div className="flex justify-between text-[11px] font-mono text-white/70">
                  <span>AUTISTIC JOURNEY ARCHIVE</span>
                  <span>{new Date().toISOString().split("T")[0]}</span>
                </div>
                <div className="self-center transform -rotate-12 text-sm font-mono tracking-widest text-white/50">
                  CONFIDENTIAL • BATCH VAULT
                </div>
                <div className="flex justify-between text-[10px] font-mono text-white/50">
                  <span>DO NOT DISTRIBUTE</span>
                  <span>AJ-SEC-FORENSIC</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Person Tagging Creator Modal Bar */}
      {showTagModal && (
        <div className="border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl items-center space-x-3">
            <span className="text-xs text-zinc-300 shrink-0 font-medium">
              {tagBox ? "Coordinates Set:" : "Click face on photo to pin:"}
            </span>
            <input
              type="text"
              placeholder="Batchmate name..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTag();
              }}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-white/40 focus:outline-none transition"
            />
            <button
              onClick={handleSaveTag}
              disabled={tagLoading || !tagInput.trim()}
              className="rounded-xl bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {tagLoading ? "Saving..." : "Pin Tag"}
            </button>
            <button
              onClick={() => {
                setShowTagModal(false);
                setTagBox(null);
              }}
              className="rounded-xl bg-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bottom Metadata Drawer */}
      <div className="border-t border-white/10 bg-black/60 px-4 sm:px-6 py-3 text-xs text-zinc-300 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1 text-[11px] sm:text-xs">
            {current.capturedAt && (
              <span className="flex items-center text-zinc-400">
                <Calendar className="mr-1.5 h-3.5 w-3.5 text-white" />
                {new Date(current.capturedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}

            {(current.deviceMake || current.deviceModel) && (
              <span className="flex items-center text-zinc-400">
                <Camera className="mr-1.5 h-3.5 w-3.5 text-white" />
                {[current.deviceMake, current.deviceModel].filter(Boolean).join(" ")}
              </span>
            )}

            {current.uploader && (
              <span className="flex items-center text-zinc-400">
                <User className="mr-1.5 h-3.5 w-3.5 text-white" />
                Deposited by {current.uploader.fullName}
              </span>
            )}
          </div>

          {/* Tags & Tagged People Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {currentPersonTags.map((pt) => (
              <span
                key={pt.id}
                className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] text-white flex items-center"
              >
                <User className="mr-1 h-2.5 w-2.5" />
                {pt.name}
              </span>
            ))}
            {current.tags && current.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Camera,
  User,
  Tag,
  Maximize2,
  ShieldCheck,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCw,
} from "lucide-react";

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
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagBox, setTagBox] = useState<{ x: number; y: number } | null>(null);
  const [localTags, setLocalTags] = useState<Record<string, PersonTagItem[]>>({});
  const [tagLoading, setTagLoading] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const current = items[currentIndex];

  useEffect(() => {
    setRotation(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [currentIndex]);

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

  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setCurrentTime(videoRef.current.currentTime || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
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
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/60 text-slate-900 backdrop-blur-xl select-none"
    >
      {/* Top Controls Bar */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 border-b border-slate-200/80 bg-white/95 shadow-xs">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-slate-500">
            {currentIndex + 1} / {items.length}
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <p className="truncate text-xs font-medium text-slate-800 max-w-[150px] sm:max-w-sm">
            {current.originalFilename}
          </p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            title="Rotate 90° Clockwise"
            className="flex items-center rounded-xl px-3 py-1.5 text-xs font-medium transition bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-2xs"
          >
            <RotateCw className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
            <span>Rotate</span>
            {rotation > 0 && (
              <span className="ml-1 text-[10px] font-mono text-slate-500">
                {rotation}°
              </span>
            )}
          </button>

          {!current.isVideo && (
            <button
              onClick={() => {
                setShowTagModal(!showTagModal);
                setTagBox(null);
              }}
              className={`flex items-center rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                showTagModal
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-2xs"
              }`}
            >
              <User className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tag Person</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
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
              className="absolute left-2 sm:left-4 z-20 rounded-full bg-white/90 p-2.5 sm:p-3 text-slate-800 backdrop-blur-md hover:bg-white transition border border-slate-200 shadow-md"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-20 rounded-full bg-white/90 p-2.5 sm:p-3 text-slate-800 backdrop-blur-md hover:bg-white transition border border-slate-200 shadow-md"
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
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                style={{
                  transform: rotation ? `rotate(${rotation}deg)` : undefined,
                  transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                className="max-h-[72vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain border border-slate-200/40 cursor-pointer"
              />
              {/* Custom Player Toolbar with Video Scrollbar / Scrubber */}
              <div className="mt-3 flex w-[90vw] max-w-xl items-center space-x-3 rounded-2xl bg-white/95 px-4 py-2.5 backdrop-blur-xl border border-slate-200 shadow-md">
                {/* Play / Pause Toggle */}
                <button
                  onClick={togglePlay}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
                </button>

                {/* Current Time Elapsed */}
                <span className="shrink-0 text-[11px] font-mono font-medium text-slate-700 min-w-[32px] text-right">
                  {formatTime(currentTime)}
                </span>

                {/* Video Scrollbar / Timeline Slider */}
                <div className="relative flex flex-1 items-center">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    onMouseDown={() => setIsScrubbing(true)}
                    onMouseUp={() => setIsScrubbing(false)}
                    onTouchStart={() => setIsScrubbing(true)}
                    onTouchEnd={() => setIsScrubbing(false)}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-slate-900 focus:outline-none transition"
                    style={{
                      background: `linear-gradient(to right, #0f172a ${(currentTime / (duration || 1)) * 100}%, #e2e8f0 ${(currentTime / (duration || 1)) * 100}%)`,
                    }}
                    title={`Seek: ${formatTime(currentTime)} / ${formatTime(duration)}`}
                  />
                </div>

                {/* Total Duration */}
                <span className="shrink-0 text-[11px] font-mono text-slate-400 min-w-[32px]">
                  {formatTime(duration)}
                </span>

                {/* Mute Toggle */}
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
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
                style={{
                  transform: rotation ? `rotate(${rotation}deg)` : undefined,
                  transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                className="max-h-[75vh] sm:max-h-[80vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/10"
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
            </div>
          )}
        </div>
      </div>

      {/* Person Tagging Creator Modal Bar */}
      {showTagModal && (
        <div className="border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl items-center space-x-3">
            <span className="text-xs text-slate-600 shrink-0 font-medium">
              {tagBox ? "Coordinates Set:" : "Click face on photo to pin:"}
            </span>
            <input
              type="text"
              placeholder="Person's name..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTag();
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition"
            />
            <button
              onClick={handleSaveTag}
              disabled={tagLoading || !tagInput.trim()}
              className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 shadow-xs"
            >
              {tagLoading ? "Saving..." : "Pin Tag"}
            </button>
            <button
              onClick={() => {
                setShowTagModal(false);
                setTagBox(null);
              }}
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bottom Metadata Drawer */}
      <div className="border-t border-slate-200/80 bg-white/95 px-4 sm:px-6 py-3 text-xs text-slate-600 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1 text-[11px] sm:text-xs">
            {current.capturedAt && (
              <span className="flex items-center text-slate-500">
                <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
                {new Date(current.capturedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}

            {(current.deviceMake || current.deviceModel) && (
              <span className="flex items-center text-slate-500">
                <Camera className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
                {[current.deviceMake, current.deviceModel].filter(Boolean).join(" ")}
              </span>
            )}

            {current.uploader && (
              <span className="flex items-center text-slate-500">
                <User className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
                Deposited by {current.uploader.fullName}
              </span>
            )}
          </div>

          {/* Tags & Tagged People Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {currentPersonTags.map((pt) => (
              <span
                key={pt.id}
                className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] text-slate-700 flex items-center font-medium"
              >
                <User className="mr-1 h-2.5 w-2.5" />
                {pt.name}
              </span>
            ))}
            {current.tags && current.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 border border-slate-200"
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

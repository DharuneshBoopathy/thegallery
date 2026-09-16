"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle, AlertCircle, RefreshCw, Film, Image as ImageIcon, X, Lock, Users, Shield } from "lucide-react";

interface UploadFileItem {
  id: string;
  file: File;
  progress: number;
  status: "idle" | "presigning" | "uploading" | "confirming" | "done" | "error";
  error?: string;
  assetId?: string;
}

export default function BatchUploader() {
  const [items, setItems] = useState<UploadFileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [visibilityMode, setVisibilityMode] = useState<string>("PUBLIC_BATCH");
  const [allowedGender, setAllowedGender] = useState<string>("PREFER_NOT_TO_SAY");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [userCircles, setUserCircles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/groups?filter=my")
      .then((res) => res.json())
      .then((data) => {
        if (data.groups) setUserCircles(data.groups);
      })
      .catch(() => {});
  }, []);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newItems: UploadFileItem[] = Array.from(fileList).map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file: f,
      progress: 0,
      status: "idle",
    }));

    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Compute client-side SHA-256 hash using Web Crypto API
  const computeFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const uploadSingle = async (item: UploadFileItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", progress: 0, error: undefined } : i))
    );

    try {
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("visibilityMode", visibilityMode);
      if (selectedGroupId && (visibilityMode === "GROUP_ONLY" || visibilityMode === "GROUP_AND_GENDER")) {
        formData.append("groupId", selectedGroupId);
      }
      if (allowedGender && (visibilityMode === "GENDER_RESTRICTED" || visibilityMode === "GROUP_AND_GENDER")) {
        formData.append("allowedGender", allowedGender);
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/media/upload", true);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percentComplete = Math.round((evt.loaded / evt.total) * 100);
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progress: percentComplete } : i))
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, status: "done", progress: 100, assetId: res.assetId } : i))
              );
              resolve();
            } catch {
              resolve();
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error || `Upload failed with HTTP ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with HTTP ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network connection failed during upload"));
        xhr.send(formData);
      });
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: err.message } : i))
      );
    }
  };


  const uploadAll = async () => {
    const idleItems = items.filter((i) => i.status === "idle" || i.status === "error");
    for (const item of idleItems) {
      await uploadSingle(item);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="w-full space-y-6 text-slate-900">
      {/* Visibility Governance Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-slate-700" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Access & Visibility Policy
          </h4>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Visibility Scope
            </label>
            <select
              value={visibilityMode}
              onChange={(e) => setVisibilityMode(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none transition shadow-2xs"
            >
              <option value="PUBLIC_BATCH">Public (All Verified Members)</option>
              <option value="GROUP_ONLY">Circle / Group Only</option>
              <option value="GENDER_RESTRICTED">Gender Restricted</option>
              <option value="GROUP_AND_GENDER">Circle AND Gender Restricted</option>
              <option value="PRIVATE_CREATOR">Private (Only You & Archivist)</option>
            </select>
          </div>

          {(visibilityMode === "GENDER_RESTRICTED" || visibilityMode === "GROUP_AND_GENDER") && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Allowed Gender
              </label>
              <select
                value={allowedGender}
                onChange={(e) => setAllowedGender(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none transition shadow-2xs"
              >
                <option value="FEMALE">Female Only</option>
                <option value="MALE">Male Only</option>
                <option value="NON_BINARY">Non-Binary Only</option>
                <option value="PREFER_NOT_TO_SAY">Any</option>
              </select>
            </div>
          )}

          {(visibilityMode === "GROUP_ONLY" || visibilityMode === "GROUP_AND_GENDER") && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Assigned Circle
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none transition shadow-2xs"
              >
                <option value="">Select a Circle...</option>
                {userCircles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
          dragOver
            ? "border-slate-800 bg-slate-100"
            : "border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-100/60"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
          multiple
          accept="image/*,video/*"
          className="hidden"
        />
        <UploadCloud className="mx-auto h-12 w-12 text-slate-600" />
        <h3 className="mt-4 text-base font-semibold text-slate-900">Drop archive media here, or browse files</h3>
        <p className="mt-1 text-xs text-slate-500">
          Accepts high-resolution JPG, PNG, HEIC, MP4, MOV. Direct to archival storage.
        </p>
      </div>

      {/* Queue Listing */}
      {items.length > 0 && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-semibold tracking-wide text-slate-900">
              Upload Queue ({items.length} {items.length === 1 ? "file" : "files"})
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => setItems([])}
                className="rounded-xl px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
              >
                Clear All
              </button>
              <button
                onClick={uploadAll}
                className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
              >
                Upload All
              </button>
            </div>
          </div>

          <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
            {items.map((item) => {
              const isVideo = item.file.type.startsWith("video/");
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700">
                      {isVideo ? <Film className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-900">{item.file.name}</p>
                      <p className="text-[10px] text-slate-500">{formatBytes(item.file.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    {/* Status Display */}
                    {item.status === "uploading" && (
                      <div className="w-24">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full bg-slate-900 transition-all duration-150"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500">{item.progress}%</span>
                      </div>
                    )}

                    {item.status === "presigning" && (
                      <span className="text-[11px] text-slate-500">Presigning...</span>
                    )}

                    {item.status === "confirming" && (
                      <span className="text-[11px] text-slate-500">Indexing...</span>
                    )}

                    {item.status === "done" && (
                      <span className="flex items-center text-[11px] font-medium text-emerald-600">
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Ready
                      </span>
                    )}

                    {item.status === "error" && (
                      <span
                        className="flex items-center text-[11px] font-medium text-red-600"
                        title={item.error}
                      >
                        <AlertCircle className="mr-1 h-3.5 w-3.5" /> Failed
                      </span>
                    )}

                    {item.status === "idle" && (
                      <button
                        onClick={() => uploadSingle(item)}
                        className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                      >
                        Upload
                      </button>
                    )}

                    {item.status === "error" && (
                      <button
                        onClick={() => uploadSingle(item)}
                        className="rounded p-1 text-slate-500 hover:text-slate-800 transition"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

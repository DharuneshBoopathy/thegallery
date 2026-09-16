"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Archive Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4 text-center text-slate-900 select-none">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 mb-6 shadow-md">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
      </div>
      <span className="font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
        System Fault • Error Boundary
      </span>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-3">
        Archive Synchronization Interrupted
      </h1>
      <p className="max-w-md text-xs text-slate-500 mb-8 leading-relaxed">
        An unexpected error occurred while processing or rendering archive resources.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm"
      >
        <RefreshCw className="mr-2 h-4 w-4" /> Refresh & Try Again
      </button>
    </div>
  );
}

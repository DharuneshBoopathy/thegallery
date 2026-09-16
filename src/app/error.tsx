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
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center text-white select-none">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white mb-6 shadow-xl backdrop-blur-xl">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-2">
        System Fault • Vault Boundary
      </span>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mb-3">
        Archive Synchronization Interrupted
      </h1>
      <p className="max-w-md text-xs text-zinc-400 mb-8 leading-relaxed">
        An unexpected error occurred while decrypting or rendering archive resources. Your session security state has been preserved.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
      >
        <RefreshCw className="mr-2 h-4 w-4" /> Re-authenticate & Refresh
      </button>
    </div>
  );
}

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4 text-center text-slate-900 select-none">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 mb-6 shadow-md">
        <ShieldAlert className="h-8 w-8 text-slate-700" />
      </div>
      <span className="font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
        Error 404 • Not Found
      </span>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-3">
        Resource Not Found
      </h1>
      <p className="max-w-md text-xs text-slate-500 mb-8 leading-relaxed">
        The requested record, media asset, or section does not exist in the archive, or has been moved.
      </p>
      <Link
        href="/archive"
        className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Return to Archive
      </Link>
    </div>
  );
}

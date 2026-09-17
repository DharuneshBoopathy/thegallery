import { getSessionUser, isSuperAdminEmail } from "@/lib/auth";
import InfiniteGallery from "@/components/gallery/InfiniteGallery";
import MacOSDesktopShell from "@/components/macos/MacOSDesktopShell";
import { ShieldAlert, Clock, RefreshCw, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function ArchiveDashboard() {
  const user = await getSessionUser();
  const isSuper = isSuperAdminEmail(user?.email);
  const isApproved = isSuper || user?.role === "ADMIN" || user?.status === "ACTIVE";

  return (
    <MacOSDesktopShell
      appName="The Gallery"
      windowTitle={isApproved ? "Library — All Photos & Videos" : "Vault Access — Pending Approval"}
      user={user}
    >
      <div className="space-y-6">
        {isApproved ? (
          <>
            {/* Clean Header Banner for Approved Members */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="relative z-10 max-w-2xl space-y-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                  Private Digital Vault
                </span>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Welcome back, {user?.fullName?.split(" ")[0] || "Member"}.
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Explore preserved memories, discover photos and videos, or launch Spotlight with ⌘Space.
                </p>
              </div>
            </div>

            {/* Dynamic Masonry Infinite Gallery - Only for approved members */}
            <InfiniteGallery />
          </>
        ) : (
          /* Empty Dashboard for Unapproved Users */
          <div className="max-w-2xl mx-auto my-8 space-y-6">
            <div className="rounded-3xl border border-amber-200/80 bg-white p-8 shadow-sm text-center space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 shadow-xs">
                <Clock className="h-8 w-8 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center rounded-full bg-amber-100/70 border border-amber-200 px-3 py-0.5 text-[11px] font-semibold text-amber-800">
                  Account Pending Approval
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Welcome, {user?.fullName || "Member"}
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Your identity has been authenticated, but archive photos and videos are currently restricted. An archivist must approve your membership before vault media becomes visible.
                </p>
              </div>

              {/* Account Status Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-left text-xs space-y-2.5 max-w-md mx-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Email Account</span>
                  <span className="font-mono text-slate-900 font-semibold">{user?.email || "Unknown"}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Approval Status</span>
                  <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-amber-800">
                    Pending Archivist Review
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Super Admin</span>
                  <span className="font-mono text-slate-700">boopathydharunesh622@gmail.com</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/archive"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Check Approval Status</span>
                </Link>

                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                  <span>Have an Invite Code?</span>
                </Link>
              </div>

              <p className="text-[11px] text-slate-400">
                Once approved in the Admin Console, click <strong>Check Approval Status</strong> above or refresh this page to instantly view all images.
              </p>
            </div>
          </div>
        )}
      </div>
    </MacOSDesktopShell>
  );
}

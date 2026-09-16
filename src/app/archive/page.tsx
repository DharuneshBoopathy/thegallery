import { getSessionUser } from "@/lib/auth";
import InfiniteGallery from "@/components/gallery/InfiniteGallery";
import MacOSDesktopShell from "@/components/macos/MacOSDesktopShell";

export default async function ArchiveDashboard() {
  const user = await getSessionUser();

  return (
    <MacOSDesktopShell
      appName="The Gallery"
      windowTitle="Library — All Photos & Videos"
      user={user}
    >
      <div className="space-y-6">
        {/* Clean Header Banner */}
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

        {/* Dynamic Masonry Infinite Gallery */}
        <InfiniteGallery />
      </div>
    </MacOSDesktopShell>
  );
}

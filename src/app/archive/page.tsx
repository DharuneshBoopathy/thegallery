import { getSessionUser } from "@/lib/auth";
import InfiniteGallery from "@/components/gallery/InfiniteGallery";
import MacOSDesktopShell from "@/components/macos/MacOSDesktopShell";

export default async function ArchiveDashboard() {
  const user = await getSessionUser();

  return (
    <MacOSDesktopShell
      appName="Photos"
      windowTitle="Library — All Photos & Videos"
      user={user}
    >
      <div className="space-y-6">
        {/* macOS Style Subheader Banner */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent p-6 backdrop-blur-md">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white">
              Private Community Vault
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Welcome back to the living archive, {user?.fullName?.split(" ")[0] || "Chief Archivist"}.
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore college memories, search tagged classmates, filter across semesters, or launch Spotlight with ⌘Space.
            </p>
          </div>
        </div>

        {/* Dynamic Masonry Infinite Gallery */}
        <InfiniteGallery />
      </div>
    </MacOSDesktopShell>
  );
}

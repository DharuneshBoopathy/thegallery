import BatchUploader from "@/components/uploader/BatchUploader";
import MacOSDesktopShell from "@/components/macos/MacOSDesktopShell";

export default function UploadPage() {
  return (
    <MacOSDesktopShell
      appName="The Gallery"
      windowTitle="Deposit Media — Storage Vault"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Deposit Media</h1>
          <p className="mt-1 text-xs text-slate-500">
            Upload original photos and videos directly into the private Git storage vault. Files are processed, deduplicated, and version-controlled.
          </p>
        </div>

        <BatchUploader />
      </div>
    </MacOSDesktopShell>
  );
}

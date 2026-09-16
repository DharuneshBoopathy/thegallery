"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Shield, Lock, Save, CheckCircle, AlertCircle } from "lucide-react";
import MacOSDesktopShell from "@/components/macos/MacOSDesktopShell";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setFullName(data.profile.fullName || "");
          setBio(data.profile.bio || "");
          setGender(data.profile.gender || "PREFER_NOT_TO_SAY");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          bio,
          gender,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setProfile(data.profile);
      setMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-slate-400">
        Loading identity...
      </div>
    );
  }

  return (
    <MacOSDesktopShell
      appName="Autistic Journey"
      windowTitle="Identity & Vault Credentials"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Member Credentials</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Account identity, access tier, and immutable demographic controls.
          </p>
        </div>

        {msg && (
          <div
            className={`flex items-center rounded-xl p-3 text-xs ${
              msg.type === "success"
                ? "border border-white/20 bg-white/10 text-white"
                : "border border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {msg.type === "success" ? (
              <CheckCircle className="mr-2 h-4 w-4 shrink-0 text-white" />
            ) : (
              <AlertCircle className="mr-2 h-4 w-4 shrink-0 text-red-300" />
            )}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-white/10 bg-[#141416]/90 p-6 backdrop-blur-xl">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Email Address (Fixed)
            </label>
            <input
              type="text"
              disabled
              value={profile?.email || ""}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs text-zinc-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Role & Status
            </label>
            <div className="mt-1.5 flex gap-2">
              <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-mono font-semibold text-white">
                {profile?.role}
              </span>
              <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-mono font-semibold text-zinc-300">
                {profile?.status}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white focus:border-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Bio / College Memory Quote
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Mechanical 2026, resident of Hostel 3..."
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Gender Attribute
              </label>
              {profile?.isGenderLocked && (
                <span className="flex items-center text-[10px] uppercase tracking-wider text-zinc-400">
                  <Lock className="mr-1 h-3 w-3" /> Locked by Governance
                </span>
              )}
            </div>

            <select
              disabled={profile?.isGenderLocked}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={`mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-white focus:outline-none ${
                profile?.isGenderLocked ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="NON_BINARY">Non-binary</option>
            </select>
            <p className="mt-1 text-[11px] text-zinc-400">
              Used strictly for server-side visibility gates on private media (e.g. gender-segregated dorm events).
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center rounded-xl bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition disabled:opacity-50"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </form>
      </div>
    </MacOSDesktopShell>
  );
}

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
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-slate-500">
        Loading identity...
      </div>
    );
  }

  return (
    <MacOSDesktopShell
      appName="The Gallery"
      windowTitle="Identity & Credentials"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Member Credentials</h1>
          <p className="mt-1 text-xs text-slate-500">
            Account identity, role permissions, and profile preferences.
          </p>
        </div>

        {msg && (
          <div
            className={`flex items-center rounded-xl p-3 text-xs ${
              msg.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {msg.type === "success" ? (
              <CheckCircle className="mr-2 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mr-2 h-4 w-4 shrink-0 text-red-600" />
            )}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Email Address (Fixed)
            </label>
            <input
              type="text"
              disabled
              value={profile?.email || ""}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Role & Status
            </label>
            <div className="mt-1.5 flex gap-2">
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-800">
                {profile?.role}
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-600">
                {profile?.status}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Bio / Note
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A brief note about yourself..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Gender Attribute
              </label>
              {profile?.isGenderLocked && (
                <span className="flex items-center text-[10px] uppercase tracking-wider text-slate-400">
                  <Lock className="mr-1 h-3 w-3" /> Locked by Governance
                </span>
              )}
            </div>

            <select
              disabled={profile?.isGenderLocked}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={`mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none ${
                profile?.isGenderLocked ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="NON_BINARY">Non-binary</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              Used strictly for server-side visibility gates on restricted media.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </form>
      </div>
    </MacOSDesktopShell>
  );
}

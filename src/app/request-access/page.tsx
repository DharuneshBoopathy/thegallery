"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Send, CheckCircle, ArrowLeft } from "lucide-react";

export default function RequestAccessPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    collegeId: "",
    batchYear: 2026,
    department: "Computer Science & Engineering",
    gender: "PREFER_NOT_TO_SAY",
    verificationNote: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          batchYear: Number(formData.batchYear),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-white">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-white/15 bg-[#141416]/95 p-8 shadow-2xl backdrop-blur-3xl">
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center text-xs font-medium text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Login
          </Link>
          <span className="flex items-center text-xs font-semibold uppercase tracking-wider text-white">
            <Shield className="mr-1 h-3.5 w-3.5 text-white" /> Batch Verification
          </span>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">Request Vault Entry</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Don't have an invite code? Submit your college batch details for manual archivist review.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 rounded-2xl border border-white/20 bg-white/5 p-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-white" />
            <h3 className="text-base font-semibold text-white">Application Received</h3>
            <p className="text-xs leading-relaxed text-zinc-300">
              Your credentials have been queued for archivist verification. Once confirmed, an invitation code will be assigned to your college email address.
            </p>
            <Link
              href="/login"
              className="inline-block mt-3 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition"
            >
              Return to Vault Login
            </Link>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Jordan Lee"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  College Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jordan@college.edu"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  College ID / Roll No
                </label>
                <input
                  type="text"
                  required
                  value={formData.collegeId}
                  onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                  placeholder="e.g. 22BCE10482"
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Batch Graduation Year
                </label>
                <input
                  type="number"
                  required
                  value={formData.batchYear}
                  onChange={(e) => setFormData({ ...formData, batchYear: Number(e.target.value) })}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Department / Major
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Mechanical, CS, Arts..."
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Gender (Visibility Control)
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                >
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="NON_BINARY">Non-binary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Verification Proof / Notes
              </label>
              <textarea
                rows={2}
                value={formData.verificationNote}
                onChange={(e) => setFormData({ ...formData, verificationNote: e.target.value })}
                placeholder="Mention hostel room, section, or mutual contacts for faster approval..."
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-xl bg-white py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition disabled:opacity-50"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {loading ? "Submitting Application..." : "Submit for Verification"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

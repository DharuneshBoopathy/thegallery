"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Send, CheckCircle, ArrowLeft } from "lucide-react";

export default function RequestAccessPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    collegeId: "",
    batchYear: new Date().getFullYear(),
    department: "",
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
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12 text-slate-900">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Login
          </Link>
          <span className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-700">
            <Shield className="mr-1 h-3.5 w-3.5 text-slate-700" /> Identity Verification
          </span>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Request Archive Entry</h2>
          <p className="mt-1 text-xs text-slate-500">
            Don't have an invite key? Submit your verification details for archivist review.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
            <h3 className="text-base font-semibold text-slate-900">Application Received</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Your credentials have been queued for verification. Once approved, an access key will be assigned to your email address.
            </p>
            <Link
              href="/login"
              className="inline-block mt-3 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Jordan Lee"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jordan@example.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Reference / ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.collegeId}
                  onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                  placeholder="e.g. ID-2026-482"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Year
                </label>
                <input
                  type="number"
                  required
                  value={formData.batchYear}
                  onChange={(e) => setFormData({ ...formData, batchYear: Number(e.target.value) })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Group / Department
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Photography, Engineering"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Gender (Visibility Control)
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                >
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="NON_BINARY">Non-binary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Verification Proof / Notes
              </label>
              <textarea
                rows={2}
                value={formData.verificationNote}
                onChange={(e) => setFormData({ ...formData, verificationNote: e.target.value })}
                placeholder="Mention affiliations or mutual contacts for verification..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
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

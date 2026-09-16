"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  HardDrive,
  KeyRound,
  Trash2,
  FileClock,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
} from "lucide-react";
import MacOSDesktopShell from "@/components/macos/MacOSDesktopShell";

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "codes" | "deletions" | "audit">("overview");
  const [metrics, setMetrics] = useState<any>(null);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [deletions, setDeletions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Code Form State
  const [newCodeRole, setNewCodeRole] = useState("CONTRIBUTOR");
  const [newCodeUses, setNewCodeUses] = useState(1);
  const [newCodeNote, setNewCodeNote] = useState("");
  const [creatingCode, setCreatingCode] = useState(false);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/admin/metrics");
      const data = await res.json();
      if (data.metrics) {
        setMetrics(data.metrics);
        setRecentUploads(data.recentUploads || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (data.users) setUsers(data.users);
  };

  const fetchCodes = async () => {
    const res = await fetch("/api/admin/invite-codes");
    const data = await res.json();
    if (data.codes) setCodes(data.codes);
  };

  const fetchDeletions = async () => {
    const res = await fetch("/api/admin/deletion-requests?status=PENDING");
    const data = await res.json();
    if (data.requests) setDeletions(data.requests);
  };

  const fetchAudit = async () => {
    const res = await fetch("/api/admin/audit-logs");
    const data = await res.json();
    if (data.logs) setAuditLogs(data.logs);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMetrics(), fetchUsers(), fetchCodes(), fetchDeletions(), fetchAudit()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCode(true);
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newCodeRole,
          maxUses: Number(newCodeUses),
          note: newCodeNote,
        }),
      });
      if (res.ok) {
        setNewCodeNote("");
        fetchCodes();
      }
    } finally {
      setCreatingCode(false);
    }
  };

  const handleReviewDeletion = async (requestId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/admin/deletion-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Review failed");
      } else {
        fetchDeletions();
        fetchMetrics();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatStorageMB = (bytesStr?: string) => {
    if (!bytesStr) return "0 MB";
    const bytes = Number(bytesStr);
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <MacOSDesktopShell
      appName="The Gallery"
      windowTitle="Governance & Security — Admin Console"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Governance & Control Console</h1>
            <p className="mt-1 text-xs text-slate-500">Defense-in-Depth Archive Management</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-mono text-slate-700">
            TWO-MAN RULE ACTIVE
          </span>
        </div>
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "overview", label: "Overview", icon: HardDrive },
            { id: "users", label: `Users (${users.length})`, icon: Users },
            { id: "codes", label: `Invite Keys (${codes.length})`, icon: KeyRound },
            { id: "deletions", label: `Deletion Queue (${deletions.length})`, icon: Trash2 },
            { id: "audit", label: "Audit Trails", icon: FileClock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Querying governance datastore...
          </div>
        ) : (
          <>
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Total Active Members
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {metrics?.activeUsers} / {metrics?.totalUsers}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">Verified members</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Vault Memory Assets
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{metrics?.totalAssets}</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {metrics?.totalVariants} derivative variants indexed
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Storage Utilization
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatStorageMB(metrics?.storage?.totalBytes)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Raw: {formatStorageMB(metrics?.storage?.rawBytes)} | WebP:{" "}
                      {formatStorageMB(metrics?.storage?.variantsBytes)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Actionable Governance
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {metrics?.pendingDeletionRequests} Pending
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">Requires two-man review</p>
                  </div>
                </div>

                {/* Recent Ingestion Stream */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">Recent Ingestion Stream</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="pb-2">Filename</th>
                          <th className="pb-2">Uploader</th>
                          <th className="pb-2">Visibility</th>
                          <th className="pb-2">Size</th>
                          <th className="pb-2">State</th>
                          <th className="pb-2">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentUploads.map((item) => (
                          <tr key={item.id} className="text-slate-600">
                            <td className="py-2.5 font-medium text-slate-900 max-w-xs truncate">
                              {item.filename}
                            </td>
                            <td className="py-2.5">{item.uploader}</td>
                            <td className="py-2.5 font-mono text-[10px] text-slate-600">
                              {item.visibilityMode}
                            </td>
                            <td className="py-2.5">{formatStorageMB(item.sizeBytes)}</td>
                            <td className="py-2.5 font-mono text-[10px] text-slate-900">
                              {item.status}
                            </td>
                            <td className="py-2.5 text-slate-400">
                              {new Date(item.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: USERS */}
            {activeTab === "users" && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Registered Member Accounts</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                        <th className="pb-2">Member</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Role</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Gender</th>
                        <th className="pb-2">Uploads</th>
                        <th className="pb-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="text-slate-600">
                          <td className="py-2.5 font-medium text-slate-900">{u.fullName}</td>
                          <td className="py-2.5 font-mono text-slate-500">{u.email}</td>
                          <td className="py-2.5">
                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-md px-2 py-0.5 font-mono text-[10px] ${
                                u.status === "ACTIVE"
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-red-200 bg-red-50 text-red-700"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-[10px] text-slate-500">
                            {u.gender} {u.isGenderLocked && "🔒"}
                          </td>
                          <td className="py-2.5">{u._count?.uploadedAssets || 0}</td>
                          <td className="py-2.5 text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: INVITE KEYS */}
            {activeTab === "codes" && (
              <div className="space-y-6">
                {/* Generation Form */}
                <form
                  onSubmit={handleCreateCode}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Generate New Access Key
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Assigned Role
                      </label>
                      <select
                        value={newCodeRole}
                        onChange={(e) => setNewCodeRole(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                      >
                        <option value="CONTRIBUTOR">Contributor (Upload + View)</option>
                        <option value="VIEWER">Viewer (Read-Only)</option>
                        <option value="ARCHIVIST">Archivist (Moderation)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Maximum Redemptions
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={newCodeUses}
                        onChange={(e) => setNewCodeUses(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Audit Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Distribution key"
                        value={newCodeNote}
                        onChange={(e) => setNewCodeNote(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingCode}
                    className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {creatingCode ? "Generating..." : "Generate Access Key"}
                  </button>
                </form>

                {/* Listing Table */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">Active Access Codes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="pb-2">Invite Code</th>
                          <th className="pb-2">Role Granted</th>
                          <th className="pb-2">Usage</th>
                          <th className="pb-2">Creator</th>
                          <th className="pb-2">Audit Note</th>
                          <th className="pb-2">Expires</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {codes.map((c) => (
                          <tr key={c.id} className="text-slate-600">
                            <td className="py-2.5 font-mono font-semibold text-slate-900">
                              {c.code}
                            </td>
                            <td className="py-2.5 font-mono text-[10px]">{c.role}</td>
                            <td className="py-2.5">
                              {c.usesCount} / {c.maxUses}
                            </td>
                            <td className="py-2.5">{c.createdBy?.fullName}</td>
                            <td className="py-2.5 text-slate-500">{c.note || "—"}</td>
                            <td className="py-2.5 text-slate-400">
                              {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DELETIONS (TWO-MAN RULE) */}
            {activeTab === "deletions" && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Two-Man Rule Deletion Workflow Queue
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Media is soft-hidden for a 14-day grace period. Permanent storage purge requires independent administrator approval.
                  </p>
                </div>

                {deletions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No pending deletion requests. Vault integrity sound.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deletions.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <h4 className="text-xs font-semibold text-slate-900">
                              {req.asset?.originalFilename}
                            </h4>
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-mono text-amber-700">
                              PENDING_APPROVAL
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            Requested by: <strong>{req.requester?.fullName}</strong> — Reason: "
                            {req.reason}"
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Grace period ends: {new Date(req.gracePeriodEnds).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleReviewDeletion(req.id, "REJECT")}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 transition"
                          >
                            Reject & Restore
                          </button>
                          <button
                            onClick={() => handleReviewDeletion(req.id, "APPROVE")}
                            className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
                          >
                            Confirm Purge
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: AUDIT TRAILS */}
            {activeTab === "audit" && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Immutable Security Audit Trails</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                        <th className="pb-2">Timestamp</th>
                        <th className="pb-2">Actor</th>
                        <th className="pb-2">Action</th>
                        <th className="pb-2">Resource</th>
                        <th className="pb-2">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="text-slate-600">
                          <td className="py-2.5 font-mono text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 font-medium text-slate-900">
                            {log.user?.fullName || "System"}
                          </td>
                          <td className="py-2.5 font-mono text-[10px] text-slate-900">
                            {log.action}
                          </td>
                          <td className="py-2.5 text-slate-600">{log.resource}</td>
                          <td className="py-2.5 text-[11px] text-slate-400 font-mono truncate max-w-xs">
                            {log.detailsJson ? JSON.stringify(log.detailsJson) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MacOSDesktopShell>
  );
}

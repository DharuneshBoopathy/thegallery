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
      appName="Autistic Journey"
      windowTitle="Governance & Security — Mission Control"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Archivist Governance Console</h1>
            <p className="mt-1 text-xs text-zinc-400">Two-Man Rule Enforced • Strict Defense-in-Depth</p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-mono text-white">
            TWO-MAN RULE ACTIVE
          </span>
        </div>
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
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
                    ? "bg-white text-black shadow-sm"
                    : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-400">
            Querying governance datastore...
          </div>
        ) : (
          <>
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 backdrop-blur-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Total Active Members
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {metrics?.activeUsers} / {metrics?.totalUsers}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-400">Verified community members</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 backdrop-blur-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Vault Memory Assets
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">{metrics?.totalAssets}</p>
                    <p className="mt-1 text-[10px] text-zinc-400">
                      {metrics?.totalVariants} derivative variants indexed
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 backdrop-blur-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Storage Utilization
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {formatStorageMB(metrics?.storage?.totalBytes)}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-400">
                      Raw: {formatStorageMB(metrics?.storage?.rawBytes)} | WebP:{" "}
                      {formatStorageMB(metrics?.storage?.variantsBytes)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 backdrop-blur-xl">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Actionable Governance
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {metrics?.pendingDeletionRequests} Pending
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-400">Requires two-man rule review</p>
                  </div>
                </div>

                {/* Recent Ingestion Stream */}
                <div className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 space-y-4 backdrop-blur-xl">
                  <h3 className="text-sm font-semibold text-white">Recent Ingestion Stream</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-400">
                          <th className="pb-2">Filename</th>
                          <th className="pb-2">Uploader</th>
                          <th className="pb-2">Visibility</th>
                          <th className="pb-2">Size</th>
                          <th className="pb-2">State</th>
                          <th className="pb-2">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {recentUploads.map((item) => (
                          <tr key={item.id} className="text-zinc-300">
                            <td className="py-2.5 font-medium text-white max-w-xs truncate">
                              {item.filename}
                            </td>
                            <td className="py-2.5">{item.uploader}</td>
                            <td className="py-2.5 font-mono text-[10px] text-zinc-300">
                              {item.visibilityMode}
                            </td>
                            <td className="py-2.5">{formatStorageMB(item.sizeBytes)}</td>
                            <td className="py-2.5 font-mono text-[10px] text-white">
                              {item.status}
                            </td>
                            <td className="py-2.5 text-zinc-400">
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
              <div className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 space-y-4 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white">Registered Member Accounts</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-400">
                        <th className="pb-2">Member</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Role</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Gender</th>
                        <th className="pb-2">Uploads</th>
                        <th className="pb-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.map((u) => (
                        <tr key={u.id} className="text-zinc-300">
                          <td className="py-2.5 font-medium text-white">{u.fullName}</td>
                          <td className="py-2.5 font-mono text-zinc-400">{u.email}</td>
                          <td className="py-2.5">
                            <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-md px-2 py-0.5 font-mono text-[10px] ${
                                u.status === "ACTIVE"
                                  ? "border border-white/20 bg-white/10 text-white"
                                  : "border border-red-500/20 bg-red-500/10 text-red-300"
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-[10px] text-zinc-400">
                            {u.gender} {u.isGenderLocked && "🔒"}
                          </td>
                          <td className="py-2.5">{u._count?.uploadedAssets || 0}</td>
                          <td className="py-2.5 text-zinc-400">
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
                  className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 space-y-4 backdrop-blur-xl"
                >
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    Generate New Golden Invite Key
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Assigned Role
                      </label>
                      <select
                        value={newCodeRole}
                        onChange={(e) => setNewCodeRole(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                      >
                        <option value="CONTRIBUTOR">Contributor (Upload + View)</option>
                        <option value="VIEWER">Viewer (Strict Read-Only)</option>
                        <option value="ARCHIVIST">Archivist (Moderation)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Maximum Redemptions
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={newCodeUses}
                        onChange={(e) => setNewCodeUses(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        Audit Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hostel 4 batch distribution"
                        value={newCodeNote}
                        onChange={(e) => setNewCodeNote(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingCode}
                    className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition disabled:opacity-50"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {creatingCode ? "Minting Key..." : "Mint Golden Access Key"}
                  </button>
                </form>

                {/* Listing Table */}
                <div className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 space-y-4 backdrop-blur-xl">
                  <h3 className="text-sm font-semibold text-white">Active Access Codes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-400">
                          <th className="pb-2">Invite Code</th>
                          <th className="pb-2">Role Granted</th>
                          <th className="pb-2">Usage</th>
                          <th className="pb-2">Creator</th>
                          <th className="pb-2">Audit Note</th>
                          <th className="pb-2">Expires</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {codes.map((c) => (
                          <tr key={c.id} className="text-zinc-300">
                            <td className="py-2.5 font-mono font-semibold text-white">
                              {c.code}
                            </td>
                            <td className="py-2.5 font-mono text-[10px]">{c.role}</td>
                            <td className="py-2.5">
                              {c.usesCount} / {c.maxUses}
                            </td>
                            <td className="py-2.5">{c.createdBy?.fullName}</td>
                            <td className="py-2.5 text-zinc-400">{c.note || "—"}</td>
                            <td className="py-2.5 text-zinc-400">
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
              <div className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 space-y-4 backdrop-blur-xl">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Two-Man Rule Deletion Workflow Queue
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Media is soft-hidden for a 14-day grace period. Permanent storage purge requires independent administrator approval.
                  </p>
                </div>

                {deletions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400">
                    No pending deletion requests. Vault integrity sound.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deletions.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between rounded-xl border border-white/15 bg-black/60 p-4"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-white" />
                            <h4 className="text-xs font-semibold text-white">
                              {req.asset?.originalFilename}
                            </h4>
                            <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white">
                              PENDING_APPROVAL
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-300">
                            Requested by: <strong>{req.requester?.fullName}</strong> — Reason: "
                            {req.reason}"
                          </p>
                          <p className="mt-0.5 text-[10px] text-zinc-400">
                            Grace period ends: {new Date(req.gracePeriodEnds).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleReviewDeletion(req.id, "REJECT")}
                            className="rounded-xl border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10 transition"
                          >
                            Reject & Restore
                          </button>
                          <button
                            onClick={() => handleReviewDeletion(req.id, "APPROVE")}
                            className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
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
              <div className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 space-y-4 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white">Immutable Security Audit Trails</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-400">
                        <th className="pb-2">Timestamp</th>
                        <th className="pb-2">Actor</th>
                        <th className="pb-2">Action</th>
                        <th className="pb-2">Resource</th>
                        <th className="pb-2">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="text-zinc-300">
                          <td className="py-2.5 font-mono text-zinc-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 font-medium text-white">
                            {log.user?.fullName || "System"}
                          </td>
                          <td className="py-2.5 font-mono text-[10px] text-white">
                            {log.action}
                          </td>
                          <td className="py-2.5 text-zinc-300">{log.resource}</td>
                          <td className="py-2.5 text-[11px] text-zinc-400 font-mono truncate max-w-xs">
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

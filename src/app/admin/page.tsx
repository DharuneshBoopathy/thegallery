"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
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
  Copy,
  CheckCircle2,
  Globe,
  Check,
  X,
  ExternalLink,
  UserPlus,
  LogOut,
} from "lucide-react";
import MacOSDesktopShell from "@/components/macos/MacOSDesktopShell";

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "requests" | "codes" | "users" | "domain" | "deletions" | "audit"
  >("requests");
  const [metrics, setMetrics] = useState<any>(null);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [deletions, setDeletions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Code Form State
  const [newCodeCustom, setNewCodeCustom] = useState("");
  const [newCodeRole, setNewCodeRole] = useState("MEMBER");
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
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/admin/invite-codes");
      const data = await res.json();
      if (data.codes) setCodes(data.codes);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccessRequests = async () => {
    try {
      const res = await fetch("/api/admin/access-requests");
      const data = await res.json();
      if (data.requests) setAccessRequests(data.requests);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeletions = async () => {
    try {
      const res = await fetch("/api/admin/deletion-requests?status=PENDING");
      const data = await res.json();
      if (data.requests) setDeletions(data.requests);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAudit = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      const data = await res.json();
      if (data.logs) setAuditLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchMetrics(),
      fetchUsers(),
      fetchCodes(),
      fetchAccessRequests(),
      fetchDeletions(),
      fetchAudit(),
    ]).finally(() => setLoading(false));
  }, []);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCode(true);
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customCode: newCodeCustom || undefined,
          role: newCodeRole,
          maxUses: Number(newCodeUses),
          note: newCodeNote,
        }),
      });
      if (res.ok) {
        setNewCodeCustom("");
        setNewCodeNote("");
        fetchCodes();
      }
    } finally {
      setCreatingCode(false);
    }
  };

  const handleReviewRequest = async (requestId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/admin/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchAccessRequests();
        fetchCodes();
        fetchUsers();
        fetchMetrics();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: "ACTIVE" }),
      });
      if (res.ok) {
        fetchUsers();
        fetchMetrics();
      } else {
        const err = await res.json();
        alert(err.error || "Approval failed");
      }
    } catch (err: any) {
      alert(err.message || "Failed to approve user");
    }
  };

  const copyInviteLink = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/register?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(link);
    setCopiedKey(code);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pendingRequests = accessRequests.filter((r) => r.status === "PENDING");

  return (
    <MacOSDesktopShell
      appName="The Gallery"
      windowTitle="Governance & Security — Admin Console"
    >
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header Title */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Governance & Mission Control
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              User approvals, invite key management, Google Identity, and custom domain routing
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-mono text-blue-700 font-semibold shadow-2xs">
              SUPER ADMIN ACTIVE
            </span>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } catch {}
                document.cookie = "aj_auth_token=; path=/; max-age=0; SameSite=Lax;";
                try {
                  localStorage.removeItem("aj_auth_token");
                } catch {}
                window.location.href = "/login";
              }}
              className="flex items-center space-x-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition cursor-pointer shadow-2xs"
            >
              <LogOut className="h-3 w-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            {
              id: "requests",
              label: `Member Requests (${pendingRequests.length})`,
              icon: UserPlus,
              highlight: pendingRequests.length > 0,
            },
            { id: "codes", label: `Invite Keys (${codes.length})`, icon: KeyRound },
            { id: "users", label: `Members (${users.length})`, icon: Users },
            { id: "domain", label: "Custom Domain & Google", icon: Globe },
            { id: "overview", label: "Vault Stats", icon: HardDrive },
            { id: "deletions", label: `Deletions (${deletions.length})`, icon: Trash2 },
            { id: "audit", label: "Audit Log", icon: FileClock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : tab.highlight
                    ? "border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
                    : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs"
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
            {/* TAB: MEMBER REQUESTS (ACCEPT / REJECT) */}
            {activeTab === "requests" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pending Member Access Requests
                    </h3>
                    <p className="text-xs text-slate-500">
                      Accept to instantly create verified membership and issue an invitation key.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {pendingRequests.length} pending approval
                  </span>
                </div>

                {accessRequests.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 shadow-xs">
                    No access requests submitted yet. Visitors can request entry via the &quot;Request Access&quot; link on the login page.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accessRequests.map((req) => (
                      <div
                        key={req.id}
                        className={`rounded-2xl border p-5 transition shadow-xs ${
                          req.status === "PENDING"
                            ? "border-blue-200 bg-blue-50/40"
                            : req.status === "APPROVED"
                            ? "border-emerald-200 bg-emerald-50/20"
                            : "border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2.5">
                              <h4 className="text-sm font-bold text-slate-900">{req.fullName}</h4>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                                  req.status === "PENDING"
                                    ? "bg-amber-100 text-amber-800"
                                    : req.status === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {req.status}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-slate-600">{req.email}</p>
                            {req.notes && (
                              <p className="text-xs text-slate-500 italic mt-1 bg-white/60 p-2 rounded-lg border border-slate-200/60 max-w-xl">
                                &quot;{req.notes}&quot;
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400">
                              Requested on {new Date(req.createdAt).toLocaleString()}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 shrink-0">
                            {req.status === "PENDING" ? (
                              <>
                                <button
                                  onClick={() => handleReviewRequest(req.id, "APPROVE")}
                                  className="flex items-center space-x-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition shadow-xs"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Accept &amp; Approve</span>
                                </button>
                                <button
                                  onClick={() => handleReviewRequest(req.id, "REJECT")}
                                  className="flex items-center space-x-1 rounded-xl bg-white hover:bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition shadow-2xs"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : req.status === "APPROVED" ? (
                              <div className="flex items-center space-x-2">
                                {req.generatedInviteCode && (
                                  <button
                                    onClick={() => copyInviteLink(req.generatedInviteCode)}
                                    className="flex items-center space-x-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-mono text-emerald-700 hover:bg-emerald-50 transition shadow-2xs"
                                  >
                                    <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Key: {req.generatedInviteCode}</span>
                                    {copiedKey === req.generatedInviteCode ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Rejected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: INVITE KEYS (CREATE & LIST) */}
            {activeTab === "codes" && (
              <div className="space-y-6">
                {/* Generation Form */}
                <form
                  onSubmit={handleCreateCode}
                  className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Create New Access Invitation Key
                    </h4>
                    <span className="text-[11px] text-slate-400">Shareable with new members</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Custom Code (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TG-FAMILY-2026"
                        value={newCodeCustom}
                        onChange={(e) => setNewCodeCustom(e.target.value.toUpperCase())}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Assigned Role
                      </label>
                      <select
                        value={newCodeRole}
                        onChange={(e) => setNewCodeRole(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                      >
                        <option value="MEMBER">Member (Full Gallery Access)</option>
                        <option value="CONTRIBUTOR">Contributor (Upload + View)</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Max Uses
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
                        Note / Description
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VIP friends access"
                        value={newCodeNote}
                        onChange={(e) => setNewCodeNote(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingCode}
                    className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 shadow-xs"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {creatingCode ? "Generating..." : "Generate Invitation Key"}
                  </button>
                </form>

                {/* Listing Table */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">Active Invitation Keys</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="pb-2">Invite Code</th>
                          <th className="pb-2">Role Granted</th>
                          <th className="pb-2">Redemptions</th>
                          <th className="pb-2">Description</th>
                          <th className="pb-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {codes.map((c) => (
                          <tr key={c.id} className="text-slate-600">
                            <td className="py-3 font-mono font-bold text-slate-900">
                              {c.code}
                            </td>
                            <td className="py-3 font-mono text-[10px]">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                                {c.role}
                              </span>
                            </td>
                            <td className="py-3 font-mono">
                              {c.usesCount} / {c.maxUses}
                            </td>
                            <td className="py-3 text-slate-500">{c.note || "—"}</td>
                            <td className="py-3">
                              <button
                                onClick={() => copyInviteLink(c.code)}
                                className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                              >
                                {copiedKey === c.code ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-slate-400" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MEMBERS / USERS */}
            {activeTab === "users" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Registered Vault Members</h3>
                    <p className="text-xs text-slate-500">Super Admin &amp; active user accounts</p>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{users.length} members</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                        <th className="pb-2">User / Identity</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Role Privileges</th>
                        <th className="pb-2">Account Status</th>
                        <th className="pb-2">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => {
                        const isSuper =
                          u.email.toLowerCase() === "boopathydharunesh622@gmail.com" ||
                          u.email.toLowerCase() === "admin@thegallery.local";
                        return (
                          <tr key={u.id} className="text-slate-600">
                            <td className="py-3 font-semibold text-slate-900">
                              <div className="flex items-center space-x-2">
                                <span>{u.fullName}</span>
                                {isSuper && (
                                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                                )}
                              </div>
                            </td>
                            <td className="py-3 font-mono text-slate-700">{u.email}</td>
                            <td className="py-3">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                                  isSuper
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {isSuper ? "SUPER_ADMIN" : u.role}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${
                                    u.status === "ACTIVE"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {u.status === "ACTIVE" ? "Approved" : "Pending"}
                                </span>
                                {u.status !== "ACTIVE" && !isSuper && (
                                  <button
                                    onClick={() => handleApproveUser(u.id)}
                                    className="inline-flex items-center space-x-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700 active:scale-95 transition shadow-2xs cursor-pointer"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Approve</span>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-slate-400 font-mono text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: CUSTOM DOMAIN & GOOGLE IDENTITY */}
            {activeTab === "domain" && (
              <div className="space-y-6">
                {/* Custom Domain Routing Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
                  <div className="flex items-center space-x-2.5">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Custom Domain Configuration: thegallery.theautisticjourney.me
                      </h3>
                      <p className="text-xs text-slate-500">
                        Map your domain directly to this Cloudflare Tunnel
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3 text-xs">
                    <p className="font-semibold text-slate-800">
                      Step 1: Add DNS CNAME Record in your Cloudflare / DNS dashboard
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[10px] block font-sans">TYPE</span>
                        <span className="font-bold text-slate-900">CNAME</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[10px] block font-sans">NAME / HOST</span>
                        <span className="font-bold text-slate-900">thegallery</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[10px] block font-sans">TARGET / DESTINATION</span>
                        <div className="flex items-center justify-between">
                          <span className="truncate text-slate-800">
                            dictionaries-align-memories-michelle.trycloudflare.com
                          </span>
                          <button
                            onClick={() =>
                              copyText(
                                "dictionaries-align-memories-michelle.trycloudflare.com",
                                "cname"
                              )
                            }
                            className="ml-2 text-slate-500 hover:text-slate-900"
                          >
                            {copiedKey === "cname" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Proxy Status: <span className="font-semibold text-slate-800">Proxied (Orange Cloud)</span>. Cloudflare provides automatic SSL/TLS for your subdomain.
                    </p>
                  </div>
                </div>

                {/* Google OAuth Credentials Guide */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <h3 className="text-sm font-bold text-slate-900">Google OAuth 2.0 Authentication</h3>
                    </div>
                    <Link
                      href="/auth/google"
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <span>View Google Gateway</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Google sign-in is live. When logging in with <strong className="text-slate-900 font-mono">boopathydharunesh622@gmail.com</strong>, Super Admin access is automatically granted.
                  </p>

                  <div className="space-y-2 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-sans">Authorized JavaScript Origin:</span>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 p-2.5 mt-1">
                        <span className="truncate text-slate-800">https://thegallery.theautisticjourney.me</span>
                        <button
                          onClick={() => copyText("https://thegallery.theautisticjourney.me", "g_origin")}
                          className="ml-2 text-slate-500 hover:text-slate-900"
                        >
                          {copiedKey === "g_origin" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-sans">Authorized Redirect URI:</span>
                      <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 p-2.5 mt-1">
                        <span className="truncate text-slate-800">https://thegallery.theautisticjourney.me/api/auth/google/callback</span>
                        <button
                          onClick={() => copyText("https://thegallery.theautisticjourney.me/api/auth/google/callback", "g_uri")}
                          className="ml-2 text-slate-500 hover:text-slate-900"
                        >
                          {copiedKey === "g_uri" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Total Active Members
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{users.length}</p>
                    <p className="mt-1 text-[10px] text-slate-500">Verified members in vault</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Vault Memory Assets
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">4,092</p>
                    <p className="mt-1 text-[10px] text-slate-500">Photos &amp; videos in date order</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Pending Approvals
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{pendingRequests.length}</p>
                    <p className="mt-1 text-[10px] text-slate-500">Awaiting reviewer action</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Active Invitation Keys
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{codes.length}</p>
                    <p className="mt-1 text-[10px] text-slate-500">Redeemable access keys</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MacOSDesktopShell>
  );
}

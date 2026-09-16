"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Users, Shield, Compass, Lock } from "lucide-react";

import MacOSDesktopShell from "@/components/macos/MacOSDesktopShell";

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("FRIENDS");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = () => {
    setLoading(true);
    fetch("/api/groups?filter=my")
      .then((res) => res.json())
      .then((data) => {
        if (data.groups) setGroups(data.groups);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create circle");

      setShowModal(false);
      setName("");
      setDescription("");
      fetchGroups();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <MacOSDesktopShell
      appName="The Gallery"
      windowTitle="Groups & Collections"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Groups & Collections</h1>
            <p className="mt-1 text-xs text-slate-500">
              Create and manage private circles and repositories for specific events, teams, and memories.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Group
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center space-y-3 shadow-sm">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-900">No Groups Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create a group to organize media into separate dedicated collections and repositories.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 hover:border-slate-300 hover:shadow-md transition space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                    {group.type}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-900">{group.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {group.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Role: <strong className="text-slate-800 font-semibold">{group.myRole}</strong></span>
                  <span className="text-[10px] text-slate-400">
                    Created by {group.owner?.fullName?.split(" ")[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900">Create New Group</h3>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
                  {error}
                </div>
              )}
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Group Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Annual Trip 2025"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Group Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                  >
                    <option value="FRIENDS">Friends & Family</option>
                    <option value="PROJECT_TEAM">Project Team</option>
                    <option value="TRIP">Trip / Vacation</option>
                    <option value="EVENTS">Events & Celebrations</option>
                    <option value="CUSTOM">Custom Group</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What memories will live in this collection?"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
                  >
                    {creating ? "Creating..." : "Create Group"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MacOSDesktopShell>
  );
}

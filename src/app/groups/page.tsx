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
      appName="Autistic Journey"
      windowTitle="Community Circles — Sub-Vaults"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Community Circles</h1>
            <p className="mt-1 text-xs text-zinc-400">
              Private sub-vaults for batch groups, hostel wings, departments, and project teams.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-black shadow hover:bg-zinc-200 transition"
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Circle
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-xs text-zinc-400">Loading your circles...</div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#141416]/90 p-12 text-center space-y-3 backdrop-blur-xl">
            <Users className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="text-base font-semibold text-white">No Circles Joined Yet</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Create a circle to share private media with your hostel mates, project team, or close friends.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 inline-flex items-center rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create First Circle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-white/10 bg-[#141416]/90 p-5 hover:border-white/30 transition space-y-3 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300">
                    {group.type}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">{group.name}</h3>
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                    {group.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Role: <strong className="text-white">{group.myRole}</strong></span>
                  <span className="text-[10px] text-zinc-400">
                    Created by {group.owner?.fullName?.split(" ")[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#141416]/95 p-6 space-y-4 shadow-2xl backdrop-blur-2xl">
              <h3 className="text-base font-bold text-white">Create New Circle</h3>
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-300">
                  {error}
                </div>
              )}
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Circle Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hostel 4 Third Floor"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Circle Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                  >
                    <option value="FRIENDS">Friends Circle</option>
                    <option value="HOSTEL">Hostel Wing / Floor</option>
                    <option value="CLASS">Class Section</option>
                    <option value="PROJECT_TEAM">Project Team</option>
                    <option value="TRIP">Trip / Tour Group</option>
                    <option value="DEPARTMENT">Departmental Batch</option>
                    <option value="CUSTOM">Custom Circle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What memories will live in this sub-vault?"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Establish Circle"}
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

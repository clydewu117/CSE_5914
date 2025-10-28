"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type WorkoutPlan = {
  id: number;
  user_id: number;
  name: string | null;
  experience: "beginner" | "intermediate" | "advanced" | string;
  days_per_week: number;
  muscle_groups?: string | null;
  constraints?: string | null;
  generated_plan?: Record<string, unknown> | null;
  generation_prompt?: string | null;
  is_active: boolean;
  is_favorite: boolean;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
};

export default function WorkoutPlans() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setPlans([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/plans/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to load plans (${res.status})`);
        const data: WorkoutPlan[] = await res.json();
        if (!cancelled) {
          setPlans(data);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load plans";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const sortedPlans = useMemo(() => {
    if (!plans) return [] as WorkoutPlan[];
    return [...plans].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [plans]);

  const reloadPlans = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const listRes = await fetch(`${API_BASE}/api/plans/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!listRes.ok) throw new Error(`Failed to load plans (${listRes.status})`);
      const data: WorkoutPlan[] = await listRes.json();
      setPlans(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load plans";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (plan: WorkoutPlan) => {
    setEditingId(plan.id);
    setEditName(plan.name || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async () => {
    if (!token || editingId == null) return;
    const id = editingId;
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/plans/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error(`Failed to update plan (${res.status})`);
      await reloadPlans();
      cancelEdit();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update plan";
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleFavorite = async (plan: WorkoutPlan) => {
    if (!token) return;
    setUpdatingId(plan.id);
    try {
      const res = await fetch(`${API_BASE}/api/plans/${plan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_favorite: !plan.is_favorite }),
      });
      if (!res.ok) throw new Error(`Failed to update favorite (${res.status})`);
      await reloadPlans();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update favorite";
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleActive = async (plan: WorkoutPlan) => {
    if (!token) return;
    setUpdatingId(plan.id);
    try {
      const res = await fetch(`${API_BASE}/api/plans/${plan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      if (!res.ok) throw new Error(`Failed to update active (${res.status})`);
      await reloadPlans();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update active";
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const deletePlan = async (plan: WorkoutPlan) => {
    if (!token) return;
    const confirmed = typeof window !== "undefined" ? window.confirm(`Delete plan "${plan.name || "My Workout Plan"}"?`) : true;
    if (!confirmed) return;
    setDeletingId(plan.id);
    try {
      const res = await fetch(`${API_BASE}/api/plans/${plan.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to delete plan (${res.status})`);
      await reloadPlans();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete plan";
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const examplePlan: WorkoutPlan = {
    id: 0,
    user_id: 0,
    name: "Example: 3-Day Beginner Full-Body",
    experience: "beginner",
    days_per_week: 3,
    muscle_groups: "full body",
    constraints: null,
    generated_plan: {
      days: [
        {
          day: "Day 1",
          focus: "Full Body",
          exercises: [
            { name: "Squat", sets: 3, reps: "8-10" },
            { name: "Bench Press", sets: 3, reps: "8-10" },
            { name: "Lat Pulldown", sets: 3, reps: "10-12" },
          ],
        },
        {
          day: "Day 2",
          focus: "Full Body",
          exercises: [
            { name: "Deadlift (light)", sets: 3, reps: "5" },
            { name: "Overhead Press", sets: 3, reps: "8-10" },
            { name: "Seated Row", sets: 3, reps: "10-12" },
          ],
        },
        {
          day: "Day 3",
          focus: "Full Body",
          exercises: [
            { name: "Lunge", sets: 3, reps: "10/leg" },
            { name: "Incline DB Press", sets: 3, reps: "10-12" },
            { name: "Face Pull", sets: 3, reps: "12-15" },
          ],
        },
      ],
    },
    generation_prompt: null,
    is_active: false,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const createFromExample = async () => {
    if (!token) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: examplePlan.name,
          experience: examplePlan.experience,
          days_per_week: examplePlan.days_per_week,
          muscle_groups: examplePlan.muscle_groups,
          constraints: examplePlan.constraints,
        }),
      });
      if (!res.ok) throw new Error(`Failed to create plan (${res.status})`);
      // reload
      setLoading(true);
      const listRes = await fetch(`${API_BASE}/api/plans/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: WorkoutPlan[] = await listRes.json();
      setPlans(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create plan";
      setError(msg);
    } finally {
      setCreating(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Your Workout Plans</h2>
        <div className="text-sm text-muted-foreground">Loading plans…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Your Workout Plans</h2>
        <div className="text-sm text-red-600">{error}</div>
      </section>
    );
  }

  if (!sortedPlans.length) {
    return (
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Your Workout Plans</h2>
  <div className="text-sm text-muted-foreground mb-3">No plans yet. Here&#39;s an example to get you started:</div>
        <div className="rounded border bg-white/70 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">
                {examplePlan.name}
                <span className="ml-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 align-middle">Example</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Level: {examplePlan.experience} • Days/week: {examplePlan.days_per_week}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Muscles: {examplePlan.muscle_groups}
              </div>
              <ul className="mt-2 text-sm list-disc pl-5 text-slate-700">
                <li>Day 1: Squat, Bench Press, Lat Pulldown</li>
                <li>Day 2: Deadlift (light), Overhead Press, Seated Row</li>
                <li>Day 3: Lunge, Incline DB Press, Face Pull</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={createFromExample}
              disabled={creating}
              className="bg-foreground text-background px-3 py-2 rounded disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create this plan"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold mb-3">Your Workout Plans</h2>
      <ul className="grid gap-3">
        {sortedPlans.map((p) => (
          <li key={p.id} className="rounded border bg-white/70 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {editingId === p.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="border rounded px-2 py-1 w-full max-w-xs"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Plan name"
                    />
                    <button
                      onClick={saveEdit}
                      disabled={updatingId === p.id}
                      className="bg-foreground text-background px-3 py-1 rounded disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 rounded border"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="font-medium truncate">
                      {p.name || "My Workout Plan"}
                      {p.is_favorite && <button title="Favorited" className="ml-2 text-amber-600 align-middle">★</button>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Level: {p.experience} • Days/week: {p.days_per_week}
                    </div>
                    {(p.muscle_groups || p.constraints) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {p.muscle_groups && <span>Muscles: {p.muscle_groups}</span>}
                        {p.muscle_groups && p.constraints && <span> • </span>}
                        {p.constraints && <span>Constraints: {p.constraints}</span>}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  {editingId !== p.id && (
                    <button
                      onClick={() => startEdit(p)}
                      className="px-2 py-1 rounded border text-xs"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => toggleFavorite(p)}
                    disabled={updatingId === p.id}
                    className="px-2 py-1 rounded border text-xs"
                    title={p.is_favorite ? "Unfavorite" : "Favorite"}
                  >
                    {p.is_favorite ? "★" : "☆"}
                  </button>
                  <button
                    onClick={() => toggleActive(p)}
                    disabled={updatingId === p.id}
                    className="px-2 py-1 rounded border text-xs"
                    title={p.is_active ? "Set inactive" : "Set active"}
                  >
                    {p.is_active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => deletePlan(p)}
                    disabled={deletingId === p.id}
                    className="px-2 py-1 rounded border text-xs text-red-600"
                  >
                    {deletingId === p.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

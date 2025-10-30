"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Plan = {
  id: number;
  name: string | null;
  experience: string;
  days_per_week: number;
  muscle_groups?: string | null;
  constraints?: string | null;
  created_at: string;
  updated_at: string;
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError("");
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (!token) {
          setError("You must be logged in to view plans.");
          setLoading(false);
          return;
        }
        const res = await fetch("http://127.0.0.1:8000/api/plans/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to load plans");
        }
        const data = await res.json();
        setPlans(data);
      } catch (e: any) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen p-8 sm:p-20 font-sans">
      <main className="max-w-3xl mx-auto bg-white/60 p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-semibold mb-4">My Workout Plans</h1>

        {loading && <div>Loading...</div>}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">{error}</div>
        )}

        {!loading && !error && plans.length === 0 && (
          <p className="text-sm text-gray-600">No plans yet. Create one from the Create a Plan page.</p>
        )}

        <ul className="space-y-3">
          {plans.map((p) => (
            <li key={p.id} className="bg-white rounded border p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name || `Plan #${p.id}`}</div>
                <div className="text-xs text-gray-600">
                  {p.experience} · {p.days_per_week} days/week
                </div>
              </div>
              <Link href={`/plans/${p.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                View
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}



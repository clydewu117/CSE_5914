"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Plan = {
  id: number;
  name: string | null;
  experience: string;
  days_per_week: number;
  muscle_groups?: string | null;
  constraints?: string | null;
  generated_plan?: any;
  created_at: string;
  updated_at: string;
};

export default function PlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlan = async () => {
      if (!params?.id) return;
      setLoading(true);
      setError("");
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (!token) {
          setError("You must be logged in to view this plan.");
          setLoading(false);
          return;
        }
        const res = await fetch(`http://127.0.0.1:8000/api/plans/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to load plan");
        }
        const data = await res.json();
        setPlan(data);
      } catch (e: any) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [params?.id]);

  const downloadJson = () => {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan.generated_plan ?? plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workout-plan-${plan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-8 sm:p-20 font-sans">
      <main className="max-w-3xl mx-auto bg-white/60 p-8 rounded-xl shadow-md">
        <button className="text-sm text-blue-600 hover:text-blue-800 mb-4" onClick={() => router.push("/plans")}>
          ← Back to plans
        </button>
        {loading && <div>Loading...</div>}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">{error}</div>
        )}

        {plan && (
          <div>
            <h1 className="text-2xl font-semibold mb-2">{plan.name || `Plan #${plan.id}`}</h1>
            <div className="text-sm text-gray-700 mb-4">
              {plan.experience} · {plan.days_per_week} days/week
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={downloadJson} className="px-3 py-2 border rounded text-sm">Download JSON</button>
            </div>

            {plan.generated_plan ? (
              <pre className="whitespace-pre-wrap break-words text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-[70vh]">
{JSON.stringify(plan.generated_plan, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-600">No generated plan available for this plan.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}



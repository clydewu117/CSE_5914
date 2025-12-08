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
              <CalendarView generatedPlan={plan.generated_plan} daysPerWeek={plan.days_per_week} />
            ) : (
              <p className="text-sm text-gray-600">No generated plan available for this plan.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

type Exercise = {
  name?: string;
  sets?: string | number;
  reps?: string | number;
  rest?: string | number;
  notes?: string;
};

type DaySlot = {
  title: string;
  exercises: Exercise[];
};

function CalendarView({ generatedPlan, daysPerWeek }: { generatedPlan: any; daysPerWeek: number }) {
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [notesModal, setNotesModal] = useState<{ title: string; notes: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  // open/close modal visibility with small delay for smooth transition
  useEffect(() => {
    if (notesModal) {
      // show modal after it's set
      setModalVisible(true);
    } else {
      // hide immediately
      setModalVisible(false);
    }
  }, [notesModal]);

  // close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotesModal(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Try to extract a list of day objects from common shapes produced by the generator
  const extractDays = (g: any): any[] | null => {
    if (!g) return null;
    // common: { days: [...] }
    if (Array.isArray(g.days)) return g.days;
    // common: { weeks: [ { days: [...] } ] }
    if (Array.isArray(g.weeks) && g.weeks.length > 0) {
      const w0 = g.weeks[0];
      if (Array.isArray(w0.days)) return w0.days;
      // sometimes weeks[0] is itself an array of days
      if (Array.isArray(w0)) return w0;
    }
    // sometimes generator returns an array directly
    if (Array.isArray(g)) return g;
    // sometimes top-level keys are day names
    const dayKeys = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const found = dayKeys.filter((k) => typeof g[k] !== "undefined");
    if (found.length > 0) return found.map((k) => ({ title: k, exercises: g[k] }));
    return null;
  };

  const rawDays = extractDays(generatedPlan);

  const normalizeExercise = (ex: any): Exercise => {
    if (!ex) return {};
    if (typeof ex === "string") return { name: ex };
    if (typeof ex === "object") {
      return {
        name: ex.name || ex.exercise || ex.title || ex.title || ex["0"] || undefined,
        sets: ex.sets || ex.set || ex.Sets || undefined,
        reps: ex.reps || ex.Reps || ex.rep || undefined,
        rest: ex.rest || ex.Rest || undefined,
        notes: ex.notes || ex.note || ex.description || ex.desc || undefined,
      };
    }
    return { name: String(ex) };
  };

  const buildSlots = (): DaySlot[] | null => {
    if (!rawDays) return null;
    // map rawDays entries to DaySlot
    const mapped: DaySlot[] = rawDays.map((d: any, idx: number) => {
      // d may be { title, exercises } or { focus, exercises } or simply an array of exercises
      let title = d.title || d.name || d.day || `Day ${idx + 1}`;
      let exList: any[] = [];
      if (Array.isArray(d.exercises)) exList = d.exercises;
      else if (Array.isArray(d)) exList = d;
      else if (Array.isArray(d.workouts)) exList = d.workouts;
      else if (Array.isArray(d.routine)) exList = d.routine;
      else if (Array.isArray(d.items)) exList = d.items;
      else if (typeof d === "object" && (d.name || d.focus) && !Array.isArray(d)) {
        // no explicit exercises array, but object may contain single exercise info
        exList = [d];
      }
      const exercises = exList.map((e) => normalizeExercise(e)).filter(Boolean);
      return { title, exercises };
    });

    return mapped;
  };

  const slots = buildSlots();

  if (!slots || slots.length === 0) {
    // fallback: show raw JSON if we couldn't parse
    return (
      <pre className="whitespace-pre-wrap break-words text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-[70vh]">
        {JSON.stringify(generatedPlan, null, 2)}
      </pre>
    );
  }

  // Place slots into a 7-day week starting Monday. Detect explicit weekday names/ranges in slot titles
  const weekSlots: DaySlot[] = daysOfWeek.map((d) => ({ title: d, exercises: [] }));

  const dayNameToIndex: Record<string, number> = {
    monday: 0,
    mon: 0,
    tuesday: 1,
    tue: 1,
    tues: 1,
    wednesday: 2,
    wed: 2,
    thursday: 3,
    thu: 3,
    thur: 3,
    thurs: 3,
    friday: 4,
    fri: 4,
    saturday: 5,
    sat: 5,
    sunday: 6,
    sun: 6,
  };

  const parseDayIndices = (text?: string): number[] => {
    if (!text || typeof text !== "string") return [];
    const lower = text.toLowerCase();
    // find day tokens
    const tokenRegex = /\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs?|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/g;
    const tokens: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = tokenRegex.exec(lower))) tokens.push(m[1]);
    if (tokens.length === 0) return [];

    // detect a range if connector exists (e.g., '-' or 'to') between first two tokens in original text
    const rangeConnectorRegex = /(-|–|—|to)\s*/i;
    if (tokens.length >= 2 && rangeConnectorRegex.test(lower)) {
      const first = dayNameToIndex[tokens[0]];
      const last = dayNameToIndex[tokens[tokens.length - 1]];
      if (typeof first === "number" && typeof last === "number") {
        const start = Math.min(first, last);
        const end = Math.max(first, last);
        const out: number[] = [];
        for (let i = start; i <= end; i++) out.push(i);
        return out;
      }
    }

    // otherwise return distinct indices for any mentioned days
    const uniq = Array.from(new Set(tokens.map((t) => dayNameToIndex[t]).filter((n) => typeof n === "number")));
    return uniq as number[];
  };

  // Sequential placement pointer for slots without explicit days
  let nextSequential = 0;
  for (const sl of slots) {
    const indices = parseDayIndices(sl.title as string | undefined);
    if (indices.length > 0) {
      for (const idx of indices) {
        // append exercises if slot already has content
        weekSlots[idx].exercises = weekSlots[idx].exercises.concat(sl.exercises || []);
      }
    } else {
      // find next empty slot starting at nextSequential
      let placed = false;
      for (let i = nextSequential; i < 7; i++) {
        if (!weekSlots[i].exercises || weekSlots[i].exercises.length === 0) {
          weekSlots[i].exercises = weekSlots[i].exercises.concat(sl.exercises || []);
          nextSequential = i + 1;
          placed = true;
          break;
        }
      }
      // if none found forward, wrap around and try from 0
      if (!placed) {
        for (let i = 0; i < 7; i++) {
          if (!weekSlots[i].exercises || weekSlots[i].exercises.length === 0) {
            weekSlots[i].exercises = weekSlots[i].exercises.concat(sl.exercises || []);
            nextSequential = i + 1;
            placed = true;
            break;
          }
        }
      }
      // if still not placed, append to Monday as fallback
      if (!placed) {
        weekSlots[0].exercises = weekSlots[0].exercises.concat(sl.exercises || []);
      }
    }
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 text-xs">
        {weekSlots.map((s, i) => (
          <div key={i} className="border rounded p-2 bg-white/80 min-h-[8rem]">
            <div className="font-medium text-sm mb-1">{s.title}</div>
            {s.exercises.length === 0 ? (
              <div className="text-gray-400 text-xs">Rest / no workout</div>
            ) : (
              <ul className="space-y-1">
                {s.exercises.map((ex, idx) => (
                  <li key={idx} className="border-b pb-1 last:border-b-0">
                    <div className="font-semibold">{ex.name || "Exercise"}</div>
                    <div className="text-[11px] text-gray-600">
                      {ex.sets ? `Sets: ${ex.sets}` : ""}
                      {ex.reps ? ` • Reps: ${ex.reps}` : ""}
                      {ex.rest ? ` • Rest: ${ex.rest}` : ""}
                    </div>
                    {ex.notes ? (
                      <div className="mt-1">
                        <button
                          onClick={() => {
                            setNotesModal({ title: ex.name || "Notes", notes: String(ex.notes) });
                          }}
                          className="text-xs px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                        >
                          Notes
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="text-[11px] text-gray-500 mt-2">Showing first week/day breakdown from generated plan. Download JSON to inspect full structure.</div>
      {notesModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${modalVisible ? "opacity-100" : "opacity-0"}`}
            onClick={() => setNotesModal(null)}
          />
          <div
            className={`relative bg-white rounded p-4 shadow-lg w-full max-w-md z-10 transform transition-all duration-200 ${
              modalVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
            }`}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{notesModal.title}</h3>
              <button
                onClick={() => setNotesModal(null)}
                className="text-sm text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{notesModal.notes}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}



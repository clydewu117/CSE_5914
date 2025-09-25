"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Answers = {
  experience: string;
  daysPerWeek: string;
  muscleGroups: string;
  constraints: string;
};

const STORAGE_KEY = "peakform:create-plan:answers";

export default function CreatePlanPage() {
  const [answers, setAnswers] = useState<Answers>({
    experience: "",
    daysPerWeek: "",
    muscleGroups: "",
    constraints: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAnswers(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch (e) {
      // ignore
    }
  }, [answers]);

  const update = (k: keyof Answers, v: string) =>
    setAnswers((s) => ({ ...s, [k]: v }));

  return (
    <div className="min-h-screen p-8 sm:p-20 font-sans">
      <main className="max-w-3xl mx-auto bg-white/60  p-8 rounded-xl shadow-md">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/peakform-circular.png" alt="logo" width={48} height={48} />
          <h1 className="text-2xl font-semibold">Create your workout plan</h1>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Answer a few quick questions and your preferences will be used to design a personalized workout regiment that matches your needs and constraints.
        </p>

        <form className="grid gap-4">
          <label className="flex flex-col">
            <span className="mb-2 font-medium">What is your level of workout experience?</span>
            <select
              value={answers.experience}
              onChange={(e) => update("experience", e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Select experience</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>

          <label className="flex flex-col">
            <span className="mb-2 font-medium">How many days a week do you want to work out?</span>
            <select
              value={answers.daysPerWeek}
              onChange={(e) => update("daysPerWeek", e.target.value)}
              className="border rounded px-3 py-2 w-40"
            >
              <option value="">Select days</option>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={String(d)}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="mb-2 font-medium">What muscle groups do you want to target?</span>
            <input
              type="text"
              placeholder="e.g. chest, back, legs, full body"
              value={answers.muscleGroups}
              onChange={(e) => update("muscleGroups", e.target.value)}
              className="border rounded px-3 py-2"
            />
          </label>

          <label className="flex flex-col">
            <span className="mb-2 font-medium">Do you have any physical constraints?</span>
            <textarea
              placeholder="e.g. knee pain, lower-back issues, none"
              value={answers.constraints}
              onChange={(e) => update("constraints", e.target.value)}
              className="border rounded px-3 py-2 min-h-[80px]"
            />
          </label>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              className="bg-foreground text-background px-4 py-2 rounded"
            >
              Save
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setAnswers({ experience: "", daysPerWeek: "", muscleGroups: "", constraints: "" });
              }}
              className="px-4 py-2 rounded border"
            >
              Reset
            </button>
          </div>
        </form>

        
      </main>
    </div>
  );
}

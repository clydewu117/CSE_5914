"use client";

import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import WorkoutPlans from "./WorkoutPlans";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 sm:p-20 font-sans">
        <main className="max-w-2xl mx-auto bg-white/60 p-8 rounded-xl shadow-md">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-8 sm:p-20 font-sans">
      <main className="max-w-2xl mx-auto bg-white/60 p-8 rounded-xl shadow-md space-y-4">
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Username: </span>
            <span>{user.username ?? "(not set)"}</span>
          </div>
          <div>
            <span className="font-medium">Email: </span>
            <span>{user.email}</span>
          </div>
        </div>

        <WorkoutPlans />
      </main>
    </div>
  );
}

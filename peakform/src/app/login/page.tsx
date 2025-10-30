"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const endpoint = isRegisterMode 
        ? "http://127.0.0.1:8000/api/auth/register"
        : "http://127.0.0.1:8000/api/auth/login-json";
      
      const body = isRegisterMode
        ? { email, username, password }
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (isRegisterMode) {
          setError("");
          setIsRegisterMode(false); // Switch to login after successful registration
        } else {
          localStorage.setItem("access_token", data.access_token);
          try { window.dispatchEvent(new Event("peakform:auth-changed")); } catch {}
          router.push("/plans");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `${isRegisterMode ? 'Registration' : 'Login'} failed`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 sm:p-20 font-sans">
      <main className="max-w-md mx-auto bg-white/60 p-8 rounded-xl shadow-md">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/peakform-circular.png" alt="logo" width={48} height={48} />
          <h1 className="text-2xl font-semibold">
            {isRegisterMode ? "Register for PeakForm" : "Login to PeakForm"}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block mb-2 font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Your username"
              />
            </div>
          )}

          <div>
            <label className="block mb-2 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Your password"
            />
          </div>

                    <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Please wait..." : isRegisterMode ? "Register" : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError("");
              setEmail("");
              setPassword("");
              setUsername("");
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isRegisterMode ? "Already have an account? Login" : "Don't have an account? Register"}
          </button>
        </div>
      </main>
    </div>
  );
}
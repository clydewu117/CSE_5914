"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type User = {
  id: number;
  email: string;
  username?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async (tk: string) => {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${tk}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    const data: User = await res.json();
    return data;
  };

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (stored) {
      setToken(stored);
      fetchMe(stored)
        .then((u) => setUser(u))
        .catch(() => {
          // invalid token
          localStorage.removeItem("access_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (tk: string) => {
    localStorage.setItem("access_token", tk);
    setToken(tk);
    const u = await fetchMe(tk);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const u = await fetchMe(token);
      setUser(u);
    } catch {
      // token invalid
      logout();
    }
  }, [token, logout]);

  const value = useMemo(
    () => ({ user, loading, token, login, logout, refreshUser }),
    [user, loading, token, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

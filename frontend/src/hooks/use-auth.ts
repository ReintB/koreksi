"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export type AuthStudent = { id: string; nim: string; nama: string };
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: "user" | "admin";
  active: boolean;
  loginCount: number;
  lastLogin?: string | null;
  createdAt?: string | null;
  student?: AuthStudent | null;
};

type AuthState = { authenticated: boolean; user: AuthUser | null };
export function useAuth() {
  const [state, setState] = useState<AuthState>({ authenticated: false, user: null });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await api<AuthState>("/auth/me");
      setState(result);
    } catch {
      setState({ authenticated: false, user: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  return { ...state, loading, refresh };
}

export async function logout() {
  await api<void>("/auth/logout", { method: "POST" });
}

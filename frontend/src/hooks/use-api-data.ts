"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export const API_REFRESH_EVENT = "koreksi-api-refresh";

export function notifyApiRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(API_REFRESH_EVENT));
  }
}

export function useApiData<T>(path: string, initial: T, intervalMs = 5000) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const value = await api<T>(path);
      setData(value);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    const initialId = window.setTimeout(() => void refresh(), 0);
    const onRefresh = () => void refresh();
    window.addEventListener(API_REFRESH_EVENT, onRefresh);
    const id = intervalMs > 0
      ? window.setInterval(() => void refresh(), intervalMs)
      : null;
    return () => {
      window.clearTimeout(initialId);
      window.removeEventListener(API_REFRESH_EVENT, onRefresh);
      if (id !== null) window.clearInterval(id);
    };
  }, [refresh, intervalMs]);

  return { data, loading, error, refresh };
}

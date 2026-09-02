"use client";

import { useEffect, useState, type SetStateAction } from "react";

import { api } from "@/lib/api";
import {
  initialMasterData,
  type MasterData,
} from "@/lib/master-data";

let currentData: MasterData = initialMasterData;
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<(data: MasterData) => void>();

function emit() {
  for (const listener of listeners) listener(currentData);
}

async function ensureLoaded() {
  if (loaded) return;
  if (!loading) {
    loading = api<MasterData>("/master-data")
      .then((data) => {
        currentData = data;
        loaded = true;
        emit();
      })
      .finally(() => {
        loading = null;
      });
  }
  await loading;
}
export function setMasterData(value: SetStateAction<MasterData>) {
  currentData =
    typeof value === "function"
      ? (value as (data: MasterData) => MasterData)(currentData)
      : value;
  emit();

  void api<MasterData>("/master-data", {
    method: "PUT",
    body: JSON.stringify(currentData),
  }).then((serverData) => {
    currentData = serverData;
    loaded = true;
    emit();
  }).catch((error) => {
    console.error("Gagal menyimpan master data ke backend", error);
  });
}

export function useMasterData() {
  const [data, setData] = useState(currentData);
  const [isHydrated, setHydrated] = useState(loaded);

  useEffect(() => {
    listeners.add(setData);
    void ensureLoaded()
      .catch((error) => console.error("Gagal memuat master data", error))
      .finally(() => setHydrated(true));
    return () => {
      listeners.delete(setData);
    };
  }, []);

  return { data, setMasterData, isHydrated };
}

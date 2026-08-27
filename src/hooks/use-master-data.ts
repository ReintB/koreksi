"use client";

import type { SetStateAction } from "react";

import { createLocalStore, useIsHydrated } from "@/hooks/create-local-store";

import {
  MASTER_DATA_STORAGE_KEY,
  initialMasterData,
  loadMasterData,
  saveMasterData,
  type MasterData,
} from "@/lib/master-data";

const store = createLocalStore({
  key: MASTER_DATA_STORAGE_KEY,
  load: loadMasterData,
  save: saveMasterData,
  serverValue: initialMasterData,
});

export function setMasterData(value: SetStateAction<MasterData>) {
  store.set(typeof value === "function" ? value(store.get()) : value);
}

export function useMasterData() {
  return {
    data: store.useValue(),
    setMasterData,
    isHydrated: useIsHydrated(),
  };
}

"use client";

import { createLocalStore } from "@/hooks/create-local-store";

import {
  EMPTY_OVERRIDES,
  SCORE_OVERRIDE_STORAGE_KEY,
  loadScoreOverrides,
  saveScoreOverrides,
  type ScoreOverrideMap,
} from "@/lib/score-override";

const store = createLocalStore({
  key: SCORE_OVERRIDE_STORAGE_KEY,
  load: loadScoreOverrides,
  save: saveScoreOverrides,
  serverValue: EMPTY_OVERRIDES,
});

export function useScoreOverrides(): ScoreOverrideMap {
  return store.useValue();
}

export function setScoreOverride(
  submissionId: string,
  skor: number,
  catatan?: string
) {
  const catatanBersih = catatan?.trim();

  store.set({
    ...store.get(),
    [submissionId]: {
      skor,
      ...(catatanBersih ? { catatan: catatanBersih } : {}),
      diubahPada: new Date().toISOString(),
    },
  });
}

/** Mengembalikan pengumpulan ke skor otomatis. */
export function clearScoreOverride(submissionId: string) {
  const current = store.get();

  if (!(submissionId in current)) {
    return;
  }

  const next = { ...current };
  delete next[submissionId];

  store.set(next);
}

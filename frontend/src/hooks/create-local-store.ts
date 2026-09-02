"use client";

import { useSyncExternalStore } from "react";

/**
 * Store kecil di atas localStorage, dipakai use-master-data dan
 * use-score-overrides.
 *
 * Memakai useSyncExternalStore, bukan useState + useEffect: tidak memicu
 * render berantai (aturan lint set-state-in-effect), dan perubahan langsung
 * terlihat di semua komponen maupun tab lain yang membuka halaman sama.
 */
export function createLocalStore<T>({
  key,
  load,
  save,
  serverValue,
}: {
  key: string;
  load: () => T;
  save: (value: T) => void;
  /** Nilai yang dipakai saat render server dan saat hidrasi. */
  serverValue: T;
}) {
  // Dibungkus supaya nilai T yang sah bernilai null pun tetap terhitung
  // sebagai "sudah dibaca".
  let cache: { value: T } | null = null;

  const listeners = new Set<() => void>();

  function emit() {
    for (const listener of listeners) {
      listener();
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);

    // Tab lain menulis -> tab ini ikut menyegarkan.
    function onStorage(event: StorageEvent) {
      if (event.key === key) {
        cache = null;
        emit();
      }
    }

    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  /** Harus mengembalikan referensi stabil, kalau tidak React berulang tanpa henti. */
  function get(): T {
    cache ??= { value: load() };

    return cache.value;
  }

  function set(next: T) {
    cache = { value: next };
    save(next);
    emit();
  }

  function getServerSnapshot() {
    return serverValue;
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, get, getServerSnapshot);
  }

  return { get, set, useValue };
}

const subscribeNoop = () => () => {};

/**
 * false saat render server dan saat hidrasi, true sesudahnya. Dipakai untuk
 * menahan kontrol sampai isi localStorage benar-benar terbaca.
 */
export function useIsHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

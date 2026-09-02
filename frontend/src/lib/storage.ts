/**
 * Baca/tulis JSON di localStorage. Dipakai master-data dan score-override —
 * keduanya butuh guard SSR yang sama dan sama-sama tidak boleh memercayai isi
 * localStorage apa adanya (bisa diubah tangan atau berasal dari versi lama).
 */

/**
 * `normalize` menentukan bentuk akhir dari nilai mentah yang tidak dipercaya.
 * Melempar dari dalamnya — termasuk lewat akses properti pada null — akan
 * jatuh ke `fallback`, sama seperti JSON yang rusak.
 */
export function readJson<T>(
  key: string,
  fallback: T,
  normalize: (raw: unknown) => T
): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);

    return stored === null
      ? fallback
      : normalize(JSON.parse(stored));
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

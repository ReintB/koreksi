/**
 * Tenggat pengumpulan tugas.
 *
 * Disimpan sebagai ISO-8601 beroffset WIB ("2026-08-30T23:59:00+07:00"), sama
 * bentuknya dengan `dikirimPada` pada pengumpulan — jadi keduanya bisa
 * langsung dibandingkan tanpa bergantung pada zona waktu browser asisten.
 *
 * Sengaja tanpa import apa pun supaya bisa dijalankan langsung oleh Node
 * untuk pemeriksaan: `node src/lib/tenggat.check.ts`.
 */

/** Praktikum berjalan di WIB; tenggat pukul 23.59 harus berarti 23.59 WIB. */
export const OFFSET_WIB = "+07:00";

/** Di bawah ini tenggat ditandai mendesak, bukan sekadar informasi. */
const AMBANG_DEKAT = 24 * 60 * 60 * 1000;

/**
 * Nada yang sama dengan `Tone` di submission.ts. Tidak diimpor dari sana
 * supaya berkas ini tetap bebas import dan bisa diperiksa Node.
 */
export type TenggatTone = "danger" | "warning" | "neutral";

export type TenggatInfo = {
  lewat: boolean;
  label: string;
  tone: TenggatTone;
};

/**
 * Nilai <input type="datetime-local"> ("2026-08-30T23:59") menjadi ISO WIB.
 * Kosong berarti tugas tanpa batas waktu, bukan kesalahan.
 */
export function tenggatFromInput(value: string): string | null {
  const bersih = value.trim();

  if (!bersih) return null;

  // Sebagian browser menyertakan detik, sebagian tidak.
  const lengkap = bersih.length === 16 ? `${bersih}:00` : bersih;
  const iso = `${lengkap}${OFFSET_WIB}`;

  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

/** Kebalikan tenggatFromInput, untuk mengisi ulang input saat tugas diedit. */
export function tenggatToInput(
  tenggat: string | null | undefined
): string {
  return tenggat ? tenggat.slice(0, 16) : "";
}

export function isTerlambat(
  dikirimPada: string,
  tenggat: string | null | undefined
): boolean {
  if (!tenggat) return false;

  const kirim = new Date(dikirimPada).getTime();
  const batas = new Date(tenggat).getTime();

  // Data rusak jangan sampai menuduh mahasiswa terlambat.
  if (Number.isNaN(kirim) || Number.isNaN(batas)) return false;

  return kirim > batas;
}

/** Dibulatkan ke bawah agar sisa waktu tidak pernah terdengar lebih longgar. */
function selisihTeks(ms: number): string {
  const menit = Math.round(ms / 60_000);

  if (menit < 1) return "kurang dari 1 menit";
  if (menit < 60) return `${menit} menit`;

  const jam = Math.floor(menit / 60);

  if (jam < 24) return `${jam} jam`;

  return `${Math.floor(jam / 24)} hari`;
}

/**
 * Sisa waktu dalam bahasa manusia. `now` bisa diisi agar hasilnya bisa diuji;
 * di UI panggil hanya setelah hidrasi supaya render server dan klien sama.
 */
export function tenggatInfo(
  tenggat: string,
  now: number = Date.now()
): TenggatInfo {
  const batas = new Date(tenggat).getTime();

  if (Number.isNaN(batas)) {
    return {
      lewat: false,
      label: "Tenggat tidak valid",
      tone: "neutral",
    };
  }

  const selisih = batas - now;

  if (selisih < 0) {
    return {
      lewat: true,
      label: `Lewat ${selisihTeks(-selisih)}`,
      tone: "danger",
    };
  }

  return {
    lewat: false,
    label: `${selisihTeks(selisih)} lagi`,
    tone: selisih <= AMBANG_DEKAT ? "warning" : "neutral",
  };
}

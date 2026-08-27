export type StatusSubmission =
  | "menunggu"
  | "diproses"
  | "selesai"
  | "gagal";

export type EvaluationStatus =
  | "terpenuhi"
  | "sebagian"
  | "belum";

export type EvaluationItem = {
  id: string;
  materi: string;
  status: EvaluationStatus;
  catatan?: string;
};

export type SubmissionDetailData = {
  id: string;
  mataKuliah: string;
  tugasKe: number;
  judulTugas: string;
  status: StatusSubmission;
  skor: number | null;
  dikirimPada: string;
  transkrip?: string;
  rubrik?: string;
  evaluasi?: EvaluationItem[];
  errorMessage?: string;
};

/** Baris pada tabel admin: satu pengumpulan plus identitas pengirimnya. */
export type AdminSubmission = SubmissionDetailData & {
  namaMahasiswa: string;
  nim: string;
  kelasPraktikum: string;
};

/** Pengumpulan dari sudut pandang mahasiswa yang mengirimnya. */
export type MahasiswaSubmission = SubmissionDetailData & {
  linkYoutube: string;
};

export function formatSubmissionDate(
  value: string
) {
  try {
    return new Intl.DateTimeFormat(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }
    ).format(new Date(value));
  } catch {
    return value;
  }
}

export function canOpenSubmission(
  status: StatusSubmission
) {
  return (
    status === "selesai" ||
    status === "gagal"
  );
}

/* ------------------------------------------------------------------
   Satu sumber kebenaran untuk label dan warna status.
   Sebelumnya label tersebar sebagai if-chain di submission-status-badge,
   submission-detail-dialog, dan admin/page.
------------------------------------------------------------------ */

export type Tone =
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export const STATUS_META: Record<
  StatusSubmission,
  { label: string; tone: Tone }
> = {
  menunggu: {
    label: "Menunggu",
    tone: "warning",
  },
  diproses: {
    label: "Diproses",
    tone: "neutral",
  },
  selesai: {
    label: "Selesai",
    tone: "success",
  },
  gagal: {
    label: "Gagal",
    tone: "danger",
  },
};

export const EVALUATION_META: Record<
  EvaluationStatus,
  { label: string; tone: Tone }
> = {
  terpenuhi: {
    label: "Terpenuhi",
    tone: "success",
  },
  sebagian: {
    label: "Sebagian",
    tone: "warning",
  },
  belum: {
    label: "Belum ditemukan",
    tone: "danger",
  },
};

export const STATUS_ORDER: StatusSubmission[] = [
  "selesai",
  "diproses",
  "menunggu",
  "gagal",
];

/** Ambang nilai untuk mewarnai skor. */
export function scoreTone(
  skor: number
): Tone {
  if (skor >= 80) return "success";
  if (skor >= 60) return "warning";
  return "danger";
}

export function countByStatus(
  items: { status: StatusSubmission }[]
): Record<StatusSubmission, number> {
  const counts: Record<
    StatusSubmission,
    number
  > = {
    menunggu: 0,
    diproses: 0,
    selesai: 0,
    gagal: 0,
  };

  for (const item of items) {
    counts[item.status] += 1;
  }

  return counts;
}

/** Rata-rata skor dari submission yang sudah punya nilai; null bila belum ada. */
export function averageScore(
  items: { skor: number | null }[]
): number | null {
  const scored = items.filter(
    (item): item is { skor: number } =>
      item.skor !== null
  );

  if (scored.length === 0) return null;

  const total = scored.reduce(
    (sum, item) => sum + item.skor,
    0
  );

  return Math.round(
    total / scored.length
  );
}

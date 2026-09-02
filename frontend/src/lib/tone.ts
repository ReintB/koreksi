import type { Tone } from "@/lib/submission";

/** Kelas teks untuk tone status. Token --success/--warning didefinisikan
    pada lightness yang lolos 4.5:1 di atas --background pada kedua tema. */
export const toneText: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  neutral: "text-muted-foreground",
};

/** Isian lembut + teks berwarna, mengikuti pola badge destructive bawaan sistem. */
export const toneSurface: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-foreground/80",
};

export const toneDot: Record<Tone, string> = {
  success: "bg-success-fill",
  warning: "bg-warning-fill",
  danger: "bg-danger-fill",
  neutral: "bg-muted-foreground/35",
};

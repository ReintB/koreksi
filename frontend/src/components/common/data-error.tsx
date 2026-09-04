"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Pemberitahuan bahwa pemuatan data gagal, beserta jalan mencobanya lagi.
 *
 * useApiData sudah menangkap galatnya sejak awal, tetapi tidak ada halaman
 * yang membacanya — sehingga backend yang mati terlihat persis sama seperti
 * kelas yang memang belum mengumpulkan apa pun. Karena hooknya juga memuat
 * ulang tiap beberapa detik, data lama tetap tertinggal di layar tanpa tanda
 * apa pun bahwa angkanya sudah tidak diperbarui.
 */
export function DataError({
  pesan,
  onRetry,
}: {
  pesan: string | null;
  onRetry: () => void;
}) {
  if (!pesan) return null;

  return (
    <div
      role="alert"
      className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
    >
      <TriangleAlert className="size-4 shrink-0 text-destructive" />

      <div className="min-w-0 flex-1">
        <p>Gagal memuat data dari server. Yang tampil mungkin sudah usang.</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{pesan}</p>
      </div>

      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-4" />
        Coba lagi
      </Button>
    </div>
  );
}

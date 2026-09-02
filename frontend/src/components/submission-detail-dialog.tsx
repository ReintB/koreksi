"use client";

import { Download, FileText, X, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import {
  EvaluationMark,
  ScoreValue,
  SubmissionStatusBadge,
} from "@/components/submission-status-badge";

import type { SubmissionDetailData } from "@/lib/submission";

export function SubmissionDetailDialog({
  submission,
  onClose,
  onDownload,
}: {
  submission: SubmissionDetailData | null;
  onClose: () => void;
  onDownload?: (submission: SubmissionDetailData) => void;
}) {
  const completed = submission?.status === "selesai";

  return (
    <Dialog
      open={!!submission}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex !h-[90vh] !w-[94vw] !max-w-[1400px] flex-col overflow-hidden p-0"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4 sm:px-8">
          <div className="min-w-0">
            <DialogTitle className="truncate text-lg font-semibold">
              {submission
                ? `Tugas ${submission.tugasKe} — ${submission.judulTugas}`
                : "Hasil Koreksi"}
            </DialogTitle>

            {submission && (
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {submission.mataKuliah}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {completed && onDownload && submission && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Unduh hasil koreksi"
                onClick={() => onDownload(submission)}
              >
                <Download className="size-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Tutup"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {submission && <IsiDetail submission={submission} />}
      </DialogContent>
    </Dialog>
  );
}

function IsiDetail({ submission }: { submission: SubmissionDetailData }) {
  const evaluasi = submission.evaluasi ?? [];

  const materiTerpenuhi = evaluasi.filter(
    (item) => item.status === "terpenuhi"
  ).length;

  if (submission.status === "gagal") {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5 sm:px-8">
        <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center">
          <div className="w-full rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="size-5 text-destructive" />
              </div>

              <div className="min-w-0">
                <h2 className="font-medium">Pemrosesan tugas gagal</h2>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {submission.errorMessage ??
                    "Terjadi masalah saat memproses pengumpulan ini."}
                </p>

                <div className="mt-4">
                  <SubmissionStatusBadge status={submission.status} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5 sm:px-8">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-x-8 gap-y-5 rounded-lg border px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground">Skor</p>

          <div className="mt-1">
            <ScoreValue skor={submission.skor} size="lg" />
          </div>
        </div>

        {evaluasi.length > 0 && (
          <div className="w-full max-w-xs min-w-50 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs text-muted-foreground">Materi terpenuhi</p>

              <p className="tnum text-xs font-medium">
                {materiTerpenuhi}/{evaluasi.length}
              </p>
            </div>

            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
              <span
                className="animate-bar h-full bg-success-fill"
                style={{
                  width: `${(materiTerpenuhi / evaluasi.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        <SubmissionStatusBadge status={submission.status} />
      </div>

      {evaluasi.length > 0 && (
        <section className="mt-5 shrink-0">
          <div className="mb-3">
            <h2 className="text-sm font-medium">Cakupan Materi</h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Ringkasan materi yang ditemukan dalam penjelasan mahasiswa.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {evaluasi.map((item) => (
              <div key={item.id} className="rounded-md border px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-sm font-medium">{item.materi}</p>

                  <EvaluationMark status={item.status} />
                </div>

                {item.catatan && (
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {item.catatan}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 flex flex-col">
        <div className="mb-3 flex shrink-0 items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />

          <h2 className="text-sm font-medium">Detail Koreksi</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <PanelTeks
            judul="Transkrip Video"
            teks={submission.transkrip}
            kosong="Transkrip belum tersedia."
          />

          <PanelTeks
            judul="Rubrik Materi"
            teks={submission.rubrik}
            kosong="Rubrik belum tersedia."
          />
        </div>
      </section>
    </div>
  );
}

function PanelTeks({
  judul,
  teks,
  kosong,
}: {
  judul: string;
  teks?: string;
  kosong: string;
}) {
  return (
    <div className="flex flex-col">
      <p className="mb-2 shrink-0 text-sm font-medium text-muted-foreground">
        {judul}
      </p>

      <div className="h-[46vh] min-h-65 overflow-y-auto overscroll-contain rounded-md border bg-muted/60 p-5">
        <p className="max-w-[70ch] whitespace-pre-line text-sm leading-relaxed">
          {teks ?? kosong}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

import { ScoreValue } from "@/components/submission-status-badge";
import {
  clearScoreOverride,
  setScoreOverride,
  useScoreOverrides,
} from "@/hooks/use-score-overrides";
import { SKOR_MAX, SKOR_MIN, validateSkor } from "@/lib/score-override";

export type ScoreOverrideTarget = {
  id: string;
  namaMahasiswa: string;
  tugasKe: number;
  judulTugas: string;
  skorOtomatis: number | null;
};

export function ScoreOverrideDialog({
  target,
  onClose,
}: {
  target: ScoreOverrideTarget | null;
  onClose: () => void;
}) {
  const overrides = useScoreOverrides();

  const existing = target ? overrides[target.id] : undefined;

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {target && (
          <FormIsi
            key={target.id}
            target={target}
            skorTersimpan={existing?.skor}
            catatanTersimpan={existing?.catatan}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormIsi({
  target,
  skorTersimpan,
  catatanTersimpan,
  onClose,
}: {
  target: ScoreOverrideTarget;
  skorTersimpan?: number;
  catatanTersimpan?: string;
  onClose: () => void;
}) {
  const [skor, setSkor] = useState(
    String(skorTersimpan ?? target.skorOtomatis ?? "")
  );

  const [catatan, setCatatan] = useState(catatanTersimpan ?? "");

  const [error, setError] = useState<string | null>(null);

  const sudahDitimpa = skorTersimpan !== undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const pesan = validateSkor(skor);

    if (pesan) {
      setError(pesan);
      return;
    }

    setScoreOverride(target.id, Number(skor.trim()), catatan);

    toast.success("Skor diperbarui.", {
      description: `${target.namaMahasiswa} — Tugas ${target.tugasKe} kini bernilai ${skor.trim()}/100.`,
    });

    onClose();
  }

  function handleReset() {
    clearScoreOverride(target.id);

    toast.info("Skor dikembalikan ke hasil koreksi otomatis.");

    onClose();
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle className="text-lg font-semibold">
        Ubah Skor
      </DialogTitle>

      <p className="mt-1 text-sm text-muted-foreground">
        {target.namaMahasiswa} — Tugas {target.tugasKe}
        {" · "}
        {target.judulTugas}
      </p>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-md border px-4 py-3">
        <span className="text-sm text-muted-foreground">
          Skor koreksi otomatis
        </span>

        <ScoreValue skor={target.skorOtomatis} />
      </div>

      <div className="mt-5 space-y-5">
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="skor-timpa">Skor baru</FieldLabel>

          <Input
            id="skor-timpa"
            inputMode="numeric"
            autoComplete="off"
            value={skor}
            aria-invalid={!!error}
            onChange={(event) => {
              setSkor(event.target.value);
              setError(null);
            }}
            placeholder={`${SKOR_MIN}–${SKOR_MAX}`}
          />

          <FieldDescription>
            Bilangan bulat {SKOR_MIN} sampai {SKOR_MAX}.
          </FieldDescription>

          {error && <FieldError errors={[{ message: error }]} />}
        </Field>

        <Field>
          <FieldLabel htmlFor="catatan-timpa">
            Alasan{" "}
            <span className="font-normal text-muted-foreground">
              (opsional)
            </span>
          </FieldLabel>

          <Textarea
            id="catatan-timpa"
            rows={3}
            value={catatan}
            onChange={(event) => setCatatan(event.target.value)}
            placeholder="Mis. type casting sebenarnya dibahas pada menit 7."
          />

          <FieldDescription>
            Tersimpan bersama skor dan ikut terbawa saat ekspor CSV, sebagai
            jejak audit.
          </FieldDescription>
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        {sudahDitimpa && (
          <Button
            type="button"
            variant="ghost"
            className="mr-auto text-muted-foreground"
            onClick={handleReset}
          >
            <RotateCcw className="size-4" />
            Kembalikan ke otomatis
          </Button>
        )}

        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>

        <Button type="submit">Simpan Skor</Button>
      </div>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { notifyApiRefresh } from "@/hooks/use-api-data";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import { SKOR_MAX, SKOR_MIN, validateSkor } from "@/lib/score-override";

export type ScoreOverrideTarget = {
  id: string;
  namaMahasiswa: string;
  tugasKe: number;
  judulTugas: string;
  skorOtomatis: number | null;
  skorManual?: number | null;
  catatanTimpa?: string | null;
};

export function ScoreOverrideDialog({
  target,
  onClose,
}: {
  target: ScoreOverrideTarget | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {target && (
          <FormIsi key={target.id} target={target} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormIsi({
  target,
  onClose,
}: {
  target: ScoreOverrideTarget;
  onClose: () => void;
}) {
  const [skor, setSkor] = useState(
    String(target.skorManual ?? target.skorOtomatis ?? "")
  );
  const [catatan, setCatatan] = useState(target.catatanTimpa ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sudahDitimpa = target.skorManual !== null && target.skorManual !== undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pesan = validateSkor(skor);
    if (pesan) {
      setError(pesan);
      return;
    }

    try {
      setSaving(true);
      await api(`/submissions/${encodeURIComponent(target.id)}/override`, {
        method: "POST",
        body: JSON.stringify({ skor: Number(skor.trim()), catatan }),
      });
      notifyApiRefresh();
      toast.success("Skor diperbarui.", {
        description: `${target.namaMahasiswa} — Tugas ${target.tugasKe} kini bernilai ${skor.trim()}/100.`,
      });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah skor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    try {
      setSaving(true);
      await api(`/submissions/${encodeURIComponent(target.id)}/override`, {
        method: "DELETE",
      });
      notifyApiRefresh();
      toast.info("Skor dikembalikan ke hasil koreksi otomatis.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mereset skor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle className="text-lg font-semibold">Ubah Skor</DialogTitle>
      <p className="mt-1 text-sm text-muted-foreground">
        {target.namaMahasiswa} — Tugas {target.tugasKe} · {target.judulTugas}
      </p>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-md border px-4 py-3">
        <span className="text-sm text-muted-foreground">Skor koreksi otomatis</span>
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
          <FieldLabel htmlFor="catatan-timpa">Alasan (opsional)</FieldLabel>
          <Textarea
            id="catatan-timpa"
            rows={3}
            value={catatan}
            onChange={(event) => setCatatan(event.target.value)}
            placeholder="Mis. materi sebenarnya dibahas pada menit tertentu."
          />
        </Field>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        {sudahDitimpa && (
          <Button
            type="button"
            variant="ghost"
            className="mr-auto text-muted-foreground"
            onClick={() => void handleReset()}
            disabled={saving}
          >
            <RotateCcw className="size-4" />
            Kembalikan ke otomatis
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Skor"}
        </Button>
      </div>
    </form>
  );
}

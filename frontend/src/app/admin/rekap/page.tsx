"use client";

import { useState } from "react";
import { CircleDashed, FileDown, UserX } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { FilterSelect } from "@/components/filter-select";
import { Navbar } from "@/components/navbar";
import { PageHeader } from "@/components/page-header";
import { SubmissionDetailDialog } from "@/components/submission-detail-dialog";
import { TenggatText } from "@/components/tenggat-text";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  ScoreValue,
  SubmissionStatusBadge,
  TerlambatBadge,
} from "@/components/submission-status-badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useMasterData } from "@/hooks/use-master-data";
import { csvFilename, downloadCsv, toCsv } from "@/lib/csv";
import { dummyAdminSubmissions, dummyMahasiswa } from "@/lib/dummy-data";
import { buildRekap, rekapCounts, type RekapRow } from "@/lib/rekap";
import { unduhHasil } from "@/lib/unduh-hasil";
import { toneDot, toneSurface } from "@/lib/tone";
import { cn } from "@/lib/utils";

import {
  STATUS_META,
  canOpenSubmission,
  formatSubmissionDate,
  type AdminSubmission,
} from "@/lib/submission";

const SEMUA_KELAS = "semua";

const daftarTampilan = [
  { value: "semua", label: "Semua" },
  { value: "belum", label: "Belum mengumpulkan" },
  { value: "sudah", label: "Sudah mengumpulkan" },
] as const;

type Tampilan = (typeof daftarTampilan)[number]["value"];

function RingkasanRekap({
  counts,
}: {
  counts: ReturnType<typeof rekapCounts>;
}) {
  if (counts.total === 0) return null;

  const persen = Math.round((counts.sudah / counts.total) * 100);

  return (
    <div className="mb-5">
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${counts.sudah} dari ${counts.total} mahasiswa sudah mengumpulkan`}
      >
        <span
          className={cn("animate-bar h-full", toneDot.success)}
          style={{ width: `${persen}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-baseline gap-2">
          <span className="tnum font-semibold">
            {counts.sudah}/{counts.total}
          </span>

          <span className="text-muted-foreground">sudah mengumpulkan</span>
        </span>

        <span className="flex items-baseline gap-2">
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 translate-y-[-1px] rounded-full",
              toneDot.neutral
            )}
          />

          <span className="tnum font-semibold">{counts.belum}</span>

          <span className="text-muted-foreground">belum</span>
        </span>

        {counts.terlambat > 0 && (
          <span className="flex items-baseline gap-2">
            <span
              aria-hidden
              className={cn(
                "size-2 shrink-0 translate-y-[-1px] rounded-full",
                toneDot.warning
              )}
            />

            <span className="tnum font-semibold">{counts.terlambat}</span>

            <span className="text-muted-foreground">terlambat</span>
          </span>
        )}
      </div>
    </div>
  );
}

function StatusRekap({ row }: { row: RekapRow }) {
  if (!row.submission) {
    return (
      <Badge variant="ghost" className={cn("gap-1.5", toneSurface.neutral)}>
        <CircleDashed className="size-3" />
        Belum mengumpulkan
      </Badge>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <SubmissionStatusBadge status={row.submission.status} />

      {row.terlambat && <TerlambatBadge />}
    </span>
  );
}

export default function AdminRekapPage() {
  const { data } = useMasterData();

  const [mataKuliahId, setMataKuliahId] = useState("");
  const [tugasId, setTugasId] = useState("");
  const [kelas, setKelas] = useState(SEMUA_KELAS);
  const [tampilan, setTampilan] = useState<Tampilan>("semua");
  const [selected, setSelected] = useState<AdminSubmission | null>(null);

  const mataKuliah =
    data.mataKuliah.find((item) => item.id === mataKuliahId) ??
    data.mataKuliah[0] ??
    null;

  const tugasMataKuliah = data.tugas
    .filter((item) => item.mataKuliahId === mataKuliah?.id)
    .sort((a, b) => a.nomor - b.nomor);

  const tugas =
    tugasMataKuliah.find((item) => item.id === tugasId) ??
    tugasMataKuliah[0] ??
    null;

  const rows =
    mataKuliah && tugas
      ? buildRekap(dummyMahasiswa, dummyAdminSubmissions, {
          mataKuliah: mataKuliah.nama,
          tugasKe: tugas.nomor,
          kelas: kelas === SEMUA_KELAS ? null : kelas,
          tenggat: tugas.tenggat,
        })
      : [];

  const counts = rekapCounts(rows);

  const terlihat = rows.filter((row) =>
    tampilan === "semua"
      ? true
      : tampilan === "belum"
        ? row.submission === null
        : row.submission !== null
  );

  const opsiMataKuliah = data.mataKuliah.map((item) => ({
    value: item.id,
    label: item.nama,
  }));

  const opsiTugas = tugasMataKuliah.map((item) => ({
    value: item.id,
    label: `Tugas ${item.nomor} — ${item.judul}`,
  }));

  const opsiKelas = [
    { value: SEMUA_KELAS, label: "Semua Kelas" },
    ...data.kelasPraktikum.map((item) => ({
      value: item.nama,
      label: `Kelas ${item.nama}`,
    })),
  ];

  function handleExportCsv() {
    if (!mataKuliah || !tugas) return;

    const headers = [
      "Nama",
      "NIM",
      "Kelas",
      "Angkatan",
      "Mata Kuliah",
      "Tugas",
      "Judul Tugas",
      "Tenggat",
      "Status",
      "Dikirim",
      "Terlambat",
      "Skor",
    ];

    const baris = terlihat.map((row) => [
      row.mahasiswa.nama,
      row.mahasiswa.nim,
      row.mahasiswa.kelasPraktikum,
      row.mahasiswa.angkatan,
      mataKuliah.nama,
      tugas.nomor,
      tugas.judul,
      tugas.tenggat ? formatSubmissionDate(tugas.tenggat) : "",
      row.submission
        ? STATUS_META[row.submission.status].label
        : "Belum mengumpulkan",
      row.submission ? formatSubmissionDate(row.submission.dikirimPada) : "",
      row.terlambat ? "Ya" : "Tidak",
      row.submission?.skor ?? "",
    ]);

    downloadCsv(csvFilename("rekap-pengumpulan"), toCsv(headers, baris));

    toast.success(`${terlihat.length} baris rekap diekspor.`);
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <PageHeader
          title="Rekap Kelas"
          description="Daftar peserta satu tugas beserta yang belum mengumpulkan — bukan hanya pengumpulan yang sudah masuk."
          actions={
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={terlihat.length === 0}
            >
              <FileDown className="size-4" />
              Ekspor CSV
            </Button>
          }
        />

        {data.mataKuliah.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                title="Belum ada mata kuliah"
                description="Rekap dihitung per tugas, jadi mata kuliah dan tugasnya perlu dibuat terlebih dahulu."
                action={
                  <Link
                    href="/admin/tugas"
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Buka Pengaturan Tugas
                  </Link>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-end gap-3">
              <FilterSelect
                id="rekap-mata-kuliah"
                label="Mata Kuliah"
                value={mataKuliah?.id ?? ""}
                options={opsiMataKuliah}
                onChange={(value) => {
                  setMataKuliahId(value);
                  setTugasId("");
                }}
                className="w-full sm:w-64"
              />

              <FilterSelect
                id="rekap-tugas"
                label="Tugas"
                value={tugas?.id ?? ""}
                options={opsiTugas}
                onChange={setTugasId}
                className="w-full sm:w-72"
              />

              <FilterSelect
                id="rekap-kelas"
                label="Kelas Praktikum"
                value={kelas}
                options={opsiKelas}
                onChange={setKelas}
                className="w-full sm:w-40"
              />

              {tugas && (
                <p className="ml-auto flex flex-wrap items-baseline gap-x-2 pb-2 text-sm">
                  <span className="text-muted-foreground">Tenggat</span>
                  <TenggatText tenggat={tugas.tenggat} />
                </p>
              )}
            </div>

            {tugasMataKuliah.length === 0 ? (
              <Card>
                <CardContent className="p-0">
                  <EmptyState
                    title="Belum ada tugas"
                    description={`${mataKuliah?.nama} belum punya tugas, jadi belum ada yang bisa direkap.`}
                    action={
                      <Link
                        href="/admin/tugas"
                        className={cn(
                          buttonVariants({ size: "sm", variant: "outline" })
                        )}
                      >
                        Tambah Tugas
                      </Link>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <RingkasanRekap counts={counts} />

                <div className="mb-4 inline-flex rounded-lg border p-1">
                  {daftarTampilan.map((item) => (
                    <Button
                      key={item.value}
                      size="sm"
                      variant={tampilan === item.value ? "default" : "ghost"}
                      onClick={() => setTampilan(item.value)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Mahasiswa</TableHead>
                            <TableHead>NIM</TableHead>
                            <TableHead>Kelas</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Dikirim</TableHead>
                            <TableHead className="text-right">Skor</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {terlihat.length === 0 && (
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={6}>
                                <EmptyState
                                  icon={UserX}
                                  title={
                                    counts.total === 0
                                      ? "Belum ada mahasiswa terdaftar"
                                      : "Tidak ada yang cocok"
                                  }
                                  description={
                                    counts.total === 0
                                      ? "Tidak ada peserta pada kelas ini, jadi tidak ada yang bisa direkap."
                                      : "Semua peserta pada kelas ini berada di luar tampilan yang dipilih."
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          )}

                          {terlihat.map((row) => {
                            const submission = row.submission;

                            const clickable =
                              submission !== null &&
                              canOpenSubmission(submission.status);

                            return (
                              <TableRow
                                key={row.mahasiswa.id}
                                className={cn(
                                  "transition-colors",
                                  clickable &&
                                    "cursor-pointer hover:bg-muted/50"
                                )}
                                onClick={() => {
                                  if (clickable) setSelected(submission);
                                }}
                              >
                                <TableCell className="font-medium">
                                  {row.mahasiswa.nama}
                                </TableCell>

                                <TableCell className="tnum whitespace-nowrap text-muted-foreground">
                                  {row.mahasiswa.nim}
                                </TableCell>

                                <TableCell className="whitespace-nowrap">
                                  Kelas {row.mahasiswa.kelasPraktikum}
                                </TableCell>

                                <TableCell>
                                  <StatusRekap row={row} />
                                </TableCell>

                                <TableCell className="tnum whitespace-nowrap text-muted-foreground">
                                  {submission
                                    ? formatSubmissionDate(
                                        submission.dikirimPada
                                      )
                                    : "—"}
                                </TableCell>

                                <TableCell className="whitespace-nowrap text-right">
                                  <ScoreValue skor={submission?.skor ?? null} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </main>

      <SubmissionDetailDialog
        submission={selected}
        onClose={() => setSelected(null)}
        onDownload={unduhHasil}
      />
    </>
  );
}

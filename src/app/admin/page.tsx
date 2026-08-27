"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Eye,
  FilterX,
  FileDown,
  MoreHorizontal,
  PencilLine,
  Search,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/navbar";
import { PageHeader } from "@/components/page-header";
import { StatusSummary } from "@/components/status-summary";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { EmptyState } from "@/components/common/empty-state";
import { FilterSelect } from "@/components/filter-select";
import {
  ScoreValue,
  SubmissionStatusBadge,
  TerlambatBadge,
} from "@/components/submission-status-badge";
import { SubmissionDetailDialog } from "@/components/submission-detail-dialog";
import {
  ScoreOverrideDialog,
  type ScoreOverrideTarget,
} from "@/components/score-override-dialog";

import { useMasterData } from "@/hooks/use-master-data";
import { useScoreOverrides } from "@/hooks/use-score-overrides";
import { csvFilename, downloadCsv, toCsv } from "@/lib/csv";
import { dummyAdminSubmissions } from "@/lib/dummy-data";
import { ELIPSIS, nomorHalaman } from "@/lib/paginasi";
import { isTerlambat } from "@/lib/tenggat";

import {
  STATUS_META,
  canOpenSubmission,
  formatSubmissionDate,
  type AdminSubmission,
  type SubmissionDetailData,
} from "@/lib/submission";

import { cn } from "@/lib/utils";

const daftarStatus = [
  "Semua",
  "menunggu",
  "diproses",
  "selesai",
  "gagal",
] as const;

type StatusFilter = (typeof daftarStatus)[number];

const opsiMataKuliah = [
  "Semua",
  "Praktikum Alpro",
  "Praktikum Basis Data",
  "Praktikum Jaringan Komputer",
].map((nama) => ({
  value: nama,
  label: nama === "Semua" ? "Semua Mata Kuliah" : nama,
}));

const opsiKelas = ["Semua", "A", "B", "C", "D", "E"].map((kelas) => ({
  value: kelas,
  label: kelas === "Semua" ? "Semua Kelas" : `Kelas ${kelas}`,
}));

const opsiStatus = daftarStatus.map((status) => ({
  value: status,
  label: status === "Semua" ? "Semua Status" : STATUS_META[status].label,
}));

type SortKey =
  | "namaMahasiswa"
  | "nim"
  | "kelasPraktikum"
  | "mataKuliah"
  | "tugasKe"
  | "dikirimPada"
  | "skor";

type SortState = {
  key: SortKey;
  dir: "asc" | "desc";
};

type AdminRow = AdminSubmission & {
  skorOtomatis: number | null;
  catatanTimpa?: string;
  ditimpa: boolean;
  terlambat: boolean;
};

const PER_PAGE = 10;

function compareBy(a: AdminRow, b: AdminRow, key: SortKey) {
  const av = a[key];
  const bv = b[key];

  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;

  if (typeof av === "number" && typeof bv === "number") {
    return av - bv;
  }

  return String(av).localeCompare(String(bv), "id");
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;

  const Icon = !active
    ? ChevronsUpDown
    : sort.dir === "asc"
      ? ChevronUp
      : ChevronDown;

  return (
    <TableHead
      className={className}
      aria-sort={
        active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="-mx-1.5 inline-flex items-center gap-1 rounded-sm px-1.5 py-1 transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {label}

        <Icon
          aria-hidden
          className={cn(
            "size-3.5 shrink-0",
            active ? "opacity-100" : "opacity-40"
          )}
        />
      </button>
    </TableHead>
  );
}

export default function AdminPage() {
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterMataKuliah, setFilterMataKuliah] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("Semua");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [sort, setSort] = useState<SortState>({
    key: "dikirimPada",
    dir: "desc",
  });

  const [selected, setSelected] = useState<AdminRow | null>(null);
  const [ubahSkor, setUbahSkor] = useState<ScoreOverrideTarget | null>(null);

  const overrides = useScoreOverrides();
  const { data } = useMasterData();

  function tenggatTugas(mataKuliah: string, tugasKe: number) {
    const mk = data.mataKuliah.find((item) => item.nama === mataKuliah);

    return (
      data.tugas.find(
        (item) => item.mataKuliahId === mk?.id && item.nomor === tugasKe
      )?.tenggat ?? null
    );
  }

  const rows: AdminRow[] = dummyAdminSubmissions.map((submission) => {
    const timpa = overrides[submission.id];

    return {
      ...submission,
      skor: timpa ? timpa.skor : submission.skor,
      skorOtomatis: submission.skor,
      catatanTimpa: timpa?.catatan,
      ditimpa: !!timpa,
      terlambat: isTerlambat(
        submission.dikirimPada,
        tenggatTugas(submission.mataKuliah, submission.tugasKe)
      ),
    };
  });

  const kata = query.trim().toLowerCase();

  const filtered = rows.filter(
    (submission) =>
      (filterKelas === "Semua" || submission.kelasPraktikum === filterKelas) &&
      (filterMataKuliah === "Semua" ||
        submission.mataKuliah === filterMataKuliah) &&
      (filterStatus === "Semua" || submission.status === filterStatus) &&
      (kata === "" ||
        submission.namaMahasiswa.toLowerCase().includes(kata) ||
        submission.nim.includes(kata))
  );

  const arah = sort.dir === "asc" ? 1 : -1;

  const sorted = [...filtered].sort((a, b) => {
    const hasil = compareBy(a, b, sort.key);

    if (a[sort.key] === null || b[sort.key] === null) {
      return hasil;
    }

    return hasil * arah;
  });

  const totalHalaman = Math.max(1, Math.ceil(sorted.length / PER_PAGE));

  const halaman = Math.min(page, totalHalaman);
  const mulai = (halaman - 1) * PER_PAGE;
  const paged = sorted.slice(mulai, mulai + PER_PAGE);

  const adaFilterAktif =
    filterMataKuliah !== "Semua" ||
    filterKelas !== "Semua" ||
    filterStatus !== "Semua" ||
    kata !== "";

  function handleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

    setPage(1);
  }

  function resetFilter() {
    setFilterMataKuliah("Semua");
    setFilterKelas("Semua");
    setFilterStatus("Semua");
    setQuery("");
    setPage(1);
  }

  function handleExportCsv() {
    const headers = [
      "Nama",
      "NIM",
      "Kelas",
      "Mata Kuliah",
      "Tugas",
      "Judul Tugas",
      "Dikirim",
      "Terlambat",
      "Status",
      "Skor",
      "Skor Otomatis",
      "Diubah Manual",
      "Catatan",
    ];

    const baris = sorted.map((submission) => [
      submission.namaMahasiswa,
      submission.nim,
      submission.kelasPraktikum,
      submission.mataKuliah,
      submission.tugasKe,
      submission.judulTugas,
      formatSubmissionDate(submission.dikirimPada),
      submission.terlambat ? "Ya" : "Tidak",
      STATUS_META[submission.status].label,
      submission.skor,
      submission.skorOtomatis,
      submission.ditimpa ? "Ya" : "Tidak",
      submission.catatanTimpa ?? "",
    ]);

    downloadCsv(csvFilename("nilai-praktikum"), toCsv(headers, baris));

    toast.success(`${sorted.length} baris nilai diekspor.`);
  }

  function handleDownload(submission?: SubmissionDetailData) {
    if (submission) {
      console.log("Download hasil koreksi:", submission.id);
    }

    toast.info(
      "File hasil koreksi akan tersedia setelah backend penyimpanan file dihubungkan."
    );
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <PageHeader
          title="Semua Pengumpulan"
          description="Pantau proses koreksi dan lihat hasil pengumpulan mahasiswa."
          actions={
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={sorted.length === 0}
            >
              <FileDown className="size-4" />
              Ekspor CSV
            </Button>
          }
        />

        <div className="mb-5 flex flex-wrap items-end gap-3">
          <Field className="w-full sm:w-64">
            <FieldLabel htmlFor="cari-mahasiswa">Cari</FieldLabel>

            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>

              <InputGroupInput
                id="cari-mahasiswa"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Nama atau NIM"
              />
            </InputGroup>
          </Field>

          <FilterSelect
            id="filter-mata-kuliah"
            label="Mata Kuliah"
            value={filterMataKuliah}
            options={opsiMataKuliah}
            onChange={(value) => {
              setFilterMataKuliah(value);
              setPage(1);
            }}
            className="w-full sm:w-56"
          />

          <FilterSelect
            id="filter-kelas"
            label="Kelas Praktikum"
            value={filterKelas}
            options={opsiKelas}
            onChange={(value) => {
              setFilterKelas(value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          />

          <FilterSelect
            id="filter-status"
            label="Status"
            value={filterStatus}
            options={opsiStatus}
            onChange={(value) => {
              setFilterStatus(value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          />

          {adaFilterAktif && (
            <Button
              variant="ghost"
              onClick={resetFilter}
              className="text-muted-foreground"
            >
              <FilterX className="size-4" />
              Atur ulang
            </Button>
          )}

          <p
            aria-live="polite"
            className="tnum ml-auto pb-2 text-sm text-muted-foreground"
          >
            {sorted.length === 0
              ? "Tidak ada hasil"
              : `Menampilkan ${mulai + 1}–${mulai + paged.length} dari ${
                  sorted.length
                } pengumpulan`}
          </p>
        </div>

        <StatusSummary items={sorted} />

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableHead
                      label="Mahasiswa"
                      sortKey="namaMahasiswa"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="NIM"
                      sortKey="nim"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="Kelas"
                      sortKey="kelasPraktikum"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="Mata Kuliah"
                      sortKey="mataKuliah"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="Tugas"
                      sortKey="tugasKe"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableHead
                      label="Dikirim"
                      sortKey="dikirimPada"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <TableHead>Status</TableHead>
                    <SortableHead
                      label="Skor"
                      sortKey="skor"
                      sort={sort}
                      onSort={handleSort}
                      className="text-right [&>button]:ml-auto"
                    />
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sorted.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={9}>
                        <EmptyState
                          icon={SearchX}
                          title="Tidak ada pengumpulan"
                          description="Tidak ada data yang cocok dengan pencarian atau filter yang dipilih."
                          action={
                            adaFilterAktif ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetFilter}
                              >
                                <FilterX className="size-4" />
                                Atur ulang filter
                              </Button>
                            ) : undefined
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  {paged.map((submission) => {
                    const clickable = canOpenSubmission(submission.status);

                    return (
                      <TableRow
                        key={submission.id}
                        className={cn(
                          "transition-colors",
                          clickable && "cursor-pointer hover:bg-muted/50"
                        )}
                        onClick={() => {
                          if (clickable) setSelected(submission);
                        }}
                      >
                        <TableCell className="font-medium">
                          {submission.namaMahasiswa}
                        </TableCell>

                        <TableCell className="tnum whitespace-nowrap text-muted-foreground">
                          {submission.nim}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          Kelas {submission.kelasPraktikum}
                        </TableCell>

                        <TableCell className="min-w-45 text-muted-foreground">
                          {submission.mataKuliah}
                        </TableCell>

                        <TableCell className="min-w-45">
                          <p className="font-medium">
                            Tugas {submission.tugasKe}
                          </p>

                          <p className="mt-0.5 max-w-55 truncate text-xs text-muted-foreground">
                            {submission.judulTugas}
                          </p>
                        </TableCell>

                        <TableCell className="tnum whitespace-nowrap text-muted-foreground">
                          {formatSubmissionDate(submission.dikirimPada)}

                          {submission.terlambat && (
                            <span className="mt-1 block">
                              <TerlambatBadge />
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <SubmissionStatusBadge status={submission.status} />
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-right">
                          <span className="inline-flex items-center gap-1.5">
                            {submission.ditimpa && (
                              <PencilLine
                                className="size-3.5 text-muted-foreground"
                                aria-label={
                                  "Skor diubah manual dari " +
                                  (submission.skorOtomatis ?? "belum dinilai")
                                }
                              />
                            )}

                            <ScoreValue skor={submission.skor} />
                          </span>
                        </TableCell>

                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={cn(
                                buttonVariants({
                                  variant: "ghost",
                                  size: "icon-sm",
                                })
                              )}
                              aria-label={
                                "Aksi untuk " + submission.namaMahasiswa
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={!clickable}
                                onClick={() => setSelected(submission)}
                              >
                                <Eye className="size-4" />
                                Lihat Detail
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  setUbahSkor({
                                    id: submission.id,
                                    namaMahasiswa: submission.namaMahasiswa,
                                    tugasKe: submission.tugasKe,
                                    judulTugas: submission.judulTugas,
                                    skorOtomatis: submission.skorOtomatis,
                                  })
                                }
                              >
                                <PencilLine className="size-4" />
                                Ubah Skor
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={submission.status !== "selesai"}
                                onClick={() => handleDownload(submission)}
                              >
                                <Download className="size-4" />
                                Unduh Hasil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {totalHalaman > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  disabled={halaman <= 1}
                  onClick={() => setPage(Math.max(halaman - 1, 1))}
                >
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:block">Sebelumnya</span>
                </Button>
              </PaginationItem>

              {nomorHalaman(halaman, totalHalaman).map((slot, index) =>
                slot === ELIPSIS ? (
                  <PaginationItem key={`elipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={slot}>
                    <Button
                      size="icon"
                      variant={slot === halaman ? "outline" : "ghost"}
                      aria-current={slot === halaman ? "page" : undefined}
                      aria-label={`Halaman ${slot}`}
                      className="tnum"
                      onClick={() => setPage(slot)}
                    >
                      {slot}
                    </Button>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <Button
                  variant="ghost"
                  disabled={halaman >= totalHalaman}
                  onClick={() => setPage(Math.min(halaman + 1, totalHalaman))}
                >
                  <span className="hidden sm:block">Berikutnya</span>
                  <ChevronRight className="size-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Klik pengumpulan dengan status selesai atau gagal untuk melihat
          detail.
        </p>
      </main>

      <ScoreOverrideDialog target={ubahSkor} onClose={() => setUbahSkor(null)} />

      <SubmissionDetailDialog
        submission={selected}
        onClose={() => setSelected(null)}
        onDownload={handleDownload}
      />
    </>
  );
}

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
import { DataError } from "@/components/common/data-error";
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
import { labelMataKuliah } from "@/lib/master-data";
import { useAdminSubmissions } from "@/hooks/use-submissions";
import { csvFilename, downloadCsv, toCsv } from "@/lib/csv";
import { ELIPSIS, nomorHalaman } from "@/lib/paginasi";

import {
  FILTER_KOSONG,
  SEMUA,
  adaFilterAktif,
  potongHalaman,
  saringPengumpulan,
  urutanBerikutnya,
  urutkanPengumpulan,
  type FilterPengumpulan,
  type KunciUrut,
  type Urutan,
} from "@/lib/daftar-pengumpulan";
import { isTerlambat } from "@/lib/tenggat";
import { unduhHasil } from "@/lib/unduh-hasil";

import {
  STATUS_META,
  canOpenSubmission,
  formatSubmissionDate,
  type AdminSubmission,
} from "@/lib/submission";

import { cn } from "@/lib/utils";

// "diproses" sengaja tidak ditawarkan: mesin koreksi belum terpasang, jadi
// tidak ada pengumpulan yang pernah berada di status itu, dan menyediakannya
// hanya membuat asisten menyaring ke daftar yang selalu kosong.
const daftarStatus = [
  SEMUA,
  "menunggu",
  "dinilai_manual",
  "selesai",
  "gagal",
] as const;

const opsiStatus = daftarStatus.map((status) => ({
  value: status,
  label: status === SEMUA ? "Semua Status" : STATUS_META[status].label,
}));

type AdminRow = AdminSubmission & {
  skorOtomatis: number | null;
  catatanTimpa?: string | null;
  ditimpa: boolean;
  terlambat: boolean;
};

// Menilai satu kelas berarti melewati seluruh daftarnya. Dengan 10 baris,
// 120 pengumpulan menjadi 12 halaman; 25 menyamakannya dengan roster, dan
// pilihan yang lebih besar disediakan untuk kelas yang lebih besar.
const PER_PAGE_PILIHAN = ["25", "50", "100"] as const;
const PER_PAGE_BAWAAN = "25";

const opsiPerPage = PER_PAGE_PILIHAN.map((nilai) => ({
  value: nilai,
  label: `${nilai} baris`,
}));

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: KunciUrut;
  sort: Urutan;
  onSort: (key: KunciUrut) => void;
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
  const [filter, setFilter] = useState<FilterPengumpulan>(FILTER_KOSONG);
  const [page, setPage] = useState(1);

  const [sort, setSort] = useState<Urutan>({
    key: "dikirimPada",
    dir: "desc",
  });

  const [selected, setSelected] = useState<AdminRow | null>(null);
  const [ubahSkor, setUbahSkor] = useState<ScoreOverrideTarget | null>(null);
  const [perPage, setPerPage] = useState<string>(PER_PAGE_BAWAAN);

  const { data } = useMasterData();
  const {
    data: submissions,
    error: galatSubmissions,
    refresh: muatUlangSubmissions,
  } = useAdminSubmissions();

  // Diturunkan dari master data supaya mata kuliah atau kelas yang baru
  // ditambahkan di /admin/tugas langsung bisa dipakai menyaring di sini.
  const opsiMataKuliah = [
    { value: SEMUA, label: "Semua Mata Kuliah" },
    ...data.mataKuliah.map((item) => ({
      // Nilai tetap nama, karena pengumpulan menyimpan mata kuliah sebagai
      // nama. Yang berubah hanya labelnya.
      value: item.nama,
      label: labelMataKuliah(item),
    })),
  ];

  const opsiKelas = [
    { value: SEMUA, label: "Semua Kelas" },
    ...data.kelasPraktikum.map((item) => ({
      value: item.nama,
      label: `Kelas ${item.nama}`,
    })),
  ];

  function tenggatTugas(mataKuliah: string, tugasKe: number) {
    const mk = data.mataKuliah.find((item) => item.nama === mataKuliah);

    return (
      data.tugas.find(
        (item) => item.mataKuliahId === mk?.id && item.nomor === tugasKe
      )?.tenggat ?? null
    );
  }

  const rows: AdminRow[] = submissions.map((submission) => ({
    ...submission,
    skorOtomatis: submission.skorOtomatis ?? submission.skor,
    catatanTimpa: submission.catatanTimpa ?? null,
    ditimpa: submission.ditimpa,
    terlambat:
      submission.terlambat ??
      isTerlambat(
        submission.dikirimPada,
        tenggatTugas(submission.mataKuliah, submission.tugasKe)
      ),
  }));

  const sorted = urutkanPengumpulan(saringPengumpulan(rows, filter), sort);

  const {
    halaman,
    totalHalaman,
    mulai,
    items: paged,
  } = potongHalaman(sorted, page, Number(perPage));

  /**
   * Pengumpulan berikutnya yang sudah masuk tetapi belum bernilai, dihitung
   * dari seluruh hasil penyaringan — bukan hanya halaman yang tampak, supaya
   * "Simpan & lanjut" tidak berhenti di batas halaman.
   */
  function lanjutSetelah(idSekarang: string) {
    const posisi = sorted.findIndex((row) => row.id === idSekarang);

    return sorted.slice(posisi + 1).find((row) => row.skor === null) ?? null;
  }

  function targetSkor(row: AdminRow): ScoreOverrideTarget {
    return {
      id: row.id,
      namaMahasiswa: row.namaMahasiswa,
      tugasKe: row.tugasKe,
      judulTugas: row.judulTugas,
      skorOtomatis: row.skorOtomatis,
      skorManual: row.ditimpa ? row.skor : null,
      catatanTimpa: row.catatanTimpa,
    };
  }

  const filterAktif = adaFilterAktif(filter);

  /** Setiap perubahan filter mengembalikan tabel ke halaman pertama. */
  function ubahFilter(patch: Partial<FilterPengumpulan>) {
    setFilter((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function handleSort(key: KunciUrut) {
    setSort((current) => urutanBerikutnya(current, key));
    setPage(1);
  }

  function resetFilter() {
    setFilter(FILTER_KOSONG);
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
                value={filter.query}
                onChange={(event) => ubahFilter({ query: event.target.value })}
                placeholder="Nama atau NIM"
              />
            </InputGroup>
          </Field>

          <FilterSelect
            id="filter-mata-kuliah"
            label="Mata Kuliah"
            value={filter.mataKuliah}
            options={opsiMataKuliah}
            onChange={(value) => ubahFilter({ mataKuliah: value })}
            className="w-full sm:w-56"
          />

          <FilterSelect
            id="filter-kelas"
            label="Kelas Praktikum"
            value={filter.kelas}
            options={opsiKelas}
            onChange={(value) => ubahFilter({ kelas: value })}
            className="w-full sm:w-40"
          />

          <FilterSelect
            id="filter-status"
            label="Status"
            value={filter.status}
            options={opsiStatus}
            onChange={(value) =>
              ubahFilter({ status: value as FilterPengumpulan["status"] })
            }
            className="w-full sm:w-40"
          />

          {filterAktif && (
            <Button
              variant="ghost"
              onClick={resetFilter}
              className="text-muted-foreground"
            >
              <FilterX className="size-4" />
              Atur ulang
            </Button>
          )}

          <FilterSelect
            id="filter-per-halaman"
            label="Baris"
            value={perPage}
            options={opsiPerPage}
            onChange={(nilai) => {
              setPerPage(nilai);
              setPage(1);
            }}
            className="w-full sm:w-32"
          />

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

        <DataError
          pesan={galatSubmissions}
          onRetry={() => void muatUlangSubmissions()}
        />

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
                            filterAktif ? (
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
                                    skorManual: submission.ditimpa ? submission.skor : null,
                                    catatanTimpa: submission.catatanTimpa,
                                  })
                                }
                              >
                                <PencilLine className="size-4" />
                                Ubah Skor
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={submission.status !== "selesai"}
                                onClick={() => unduhHasil(submission)}
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

      <ScoreOverrideDialog
        target={ubahSkor}
        onClose={() => setUbahSkor(null)}
        onLanjut={
          ubahSkor && lanjutSetelah(ubahSkor.id)
            ? () => {
                const berikutnya = ubahSkor
                  ? lanjutSetelah(ubahSkor.id)
                  : null;
                setUbahSkor(berikutnya ? targetSkor(berikutnya) : null);
              }
            : null
        }
      />

      <SubmissionDetailDialog
        submission={selected}
        onClose={() => setSelected(null)}
        onDownload={unduhHasil}
      />
    </>
  );
}

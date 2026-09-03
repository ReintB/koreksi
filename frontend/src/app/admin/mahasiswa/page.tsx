"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2, Upload, Users } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { Navbar } from "@/components/navbar";
import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMasterData } from "@/hooks/use-master-data";
import type { Mahasiswa } from "@/hooks/use-submissions";
import { api } from "@/lib/api";
import { parseCsv } from "@/lib/csv";

const KOSONG = { nim: "", nama: "", kelas: "", angkatan: "" };

type Editor = { mode: "tambah" } | { mode: "ubah"; nim: string } | null;

type BarisImpor = {
  nim: string;
  nama: string;
  angkatan: string;
  kelas: string | null;
};

type Pratinjau = {
  berkas: string;
  siap: BarisImpor[];
  masalah: string[];
};

/**
 * Mencari indeks kolom berdasarkan nama di baris header.
 *
 * Berkas dari kampus memakai judul yang tidak seragam ("Kelas Praktik",
 * "Kelas Praktikum", "Kelas"), jadi pencocokannya memakai awalan dan
 * mengabaikan besar kecil huruf alih-alih menuntut judul yang persis.
 */
function cariKolom(header: string[], ...kandidat: string[]) {
  const bersih = header.map((judul) => judul.trim().toLowerCase());

  for (const nama of kandidat) {
    const indeks = bersih.findIndex((judul) => judul.startsWith(nama));
    if (indeks !== -1) return indeks;
  }

  return -1;
}

export default function AdminMahasiswaPage() {
  const { data: master } = useMasterData();

  const [daftar, setDaftar] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [form, setForm] = useState(KOSONG);
  const [menyimpan, setMenyimpan] = useState(false);
  const [akanDikeluarkan, setAkanDikeluarkan] = useState<Mahasiswa | null>(null);
  const [pratinjau, setPratinjau] = useState<Pratinjau | null>(null);
  const [mengimpor, setMengimpor] = useState(false);
  const berkasRef = useRef<HTMLInputElement>(null);

  const muat = useCallback(async () => {
    try {
      setLoading(true);
      setDaftar(await api<Mahasiswa[]>("/students"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat roster"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void muat());
  }, [muat]);

  const kata = cari.trim().toLowerCase();

  const terlihat = kata
    ? daftar.filter(
        (item) =>
          item.nim.toLowerCase().includes(kata) ||
          item.nama.toLowerCase().includes(kata)
      )
    : daftar;

  function bukaTambah() {
    setForm(KOSONG);
    setEditor({ mode: "tambah" });
  }

  function bukaUbah(item: Mahasiswa) {
    setForm({
      nim: item.nim,
      nama: item.nama,
      // "-" adalah penanda "belum ditetapkan" dari server, bukan nilai kelas.
      kelas: item.kelasPraktikum === "-" ? "" : item.kelasPraktikum,
      angkatan: item.angkatan,
    });
    setEditor({ mode: "ubah", nim: item.nim });
  }

  async function simpan() {
    const isi = {
      nama: form.nama.trim(),
      angkatan: form.angkatan.trim(),
      kelas: form.kelas.trim() || null,
    };

    try {
      setMenyimpan(true);

      if (editor?.mode === "ubah") {
        await api(`/students/${encodeURIComponent(editor.nim)}`, {
          method: "PATCH",
          body: JSON.stringify(isi),
        });
        toast.success("Data mahasiswa diperbarui.");
      } else {
        await api("/students", {
          method: "POST",
          body: JSON.stringify({ ...isi, nim: form.nim.trim() }),
        });
        toast.success("Mahasiswa ditambahkan ke roster.");
      }

      setEditor(null);
      await muat();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
    } finally {
      setMenyimpan(false);
    }
  }

  async function keluarkan(item: Mahasiswa) {
    try {
      await api(`/students/${encodeURIComponent(item.nim)}`, {
        method: "DELETE",
      });
      toast.success(`${item.nama} dikeluarkan dari roster.`);
      await muat();
    } catch (error) {
      // Penolakan karena masih punya pengumpulan datang sebagai pesan dari
      // server; ditampilkan apa adanya supaya alasannya jelas.
      toast.error(
        error instanceof Error ? error.message : "Gagal mengeluarkan mahasiswa"
      );
    } finally {
      setAkanDikeluarkan(null);
    }
  }

  async function bacaBerkas(berkas: File) {
    const baris = parseCsv(await berkas.text());

    if (baris.length < 2) {
      toast.error("Berkas tidak berisi data.");
      return;
    }

    const header = baris[0];
    const kolom = {
      nim: cariKolom(header, "nim"),
      nama: cariKolom(header, "nama"),
      angkatan: cariKolom(header, "angkatan"),
      kelas: cariKolom(header, "kelas"),
    };

    if (kolom.nim === -1 || kolom.nama === -1 || kolom.angkatan === -1) {
      toast.error("Kolom NIM, Nama, dan Angkatan wajib ada di baris pertama.");
      return;
    }

    const siap: BarisImpor[] = [];
    const masalah: string[] = [];

    baris.slice(1).forEach((isi, urutan) => {
      const ambil = (indeks: number) =>
        indeks === -1 ? "" : (isi[indeks] ?? "").trim();

      const nim = ambil(kolom.nim);
      const nama = ambil(kolom.nama);
      const angkatan = ambil(kolom.angkatan);

      // Nomor baris mengikuti berkas aslinya, termasuk baris header, supaya
      // yang bermasalah bisa langsung dibuka di spreadsheet.
      if (!nim || !nama || !angkatan) {
        masalah.push(
          `Baris ${urutan + 2}: ${[
            !nim && "NIM",
            !nama && "nama",
            !angkatan && "angkatan",
          ]
            .filter(Boolean)
            .join(", ")} kosong`
        );
        return;
      }

      siap.push({ nim, nama, angkatan, kelas: ambil(kolom.kelas) || null });
    });

    setPratinjau({ berkas: berkas.name, siap, masalah });
  }

  async function jalankanImpor() {
    if (!pratinjau) return;

    try {
      setMengimpor(true);

      const hasil = await api<{
        total: number;
        baru: number;
        diperbarui: number;
        duplikatDalamBerkas: number;
      }>("/students/impor", {
        method: "POST",
        body: JSON.stringify({ mahasiswa: pratinjau.siap }),
      });

      toast.success(`${hasil.total} mahasiswa diimpor.`, {
        description: `${hasil.baru} baru, ${hasil.diperbarui} diperbarui${
          hasil.duplikatDalamBerkas > 0
            ? `, ${hasil.duplikatDalamBerkas} baris berulang diabaikan`
            : ""
        }.`,
      });

      setPratinjau(null);
      await muat();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impor gagal");
    } finally {
      setMengimpor(false);
    }
  }

  const bolehSimpan =
    form.nama.trim().length >= 3 &&
    form.angkatan.trim() !== "" &&
    (editor?.mode === "ubah" || form.nim.trim() !== "");

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <PageHeader
          title="Mahasiswa"
          description="Daftar peserta praktikum. Roster inilah yang dipakai saat menautkan akun Google ke NIM, dan yang membuat rekap bisa menyebut siapa saja yang belum mengumpulkan."
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => void muat()}
                disabled={loading}
              >
                <RefreshCw className="size-4" />
                Muat Ulang
              </Button>

              <input
                ref={berkasRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const berkas = event.target.files?.[0];
                  if (berkas) void bacaBerkas(berkas);
                  // Dikosongkan supaya memilih berkas yang sama dua kali
                  // berturut-turut tetap memicu onChange.
                  event.target.value = "";
                }}
              />

              <Button
                variant="outline"
                onClick={() => berkasRef.current?.click()}
              >
                <Upload className="size-4" />
                Impor CSV
              </Button>

              <Button onClick={bukaTambah}>
                <Plus className="size-4" />
                Tambah
              </Button>
            </div>
          }
        />

        <div className="mb-4 flex items-center gap-3">
          <Input
            value={cari}
            onChange={(event) => setCari(event.target.value)}
            placeholder="Cari NIM atau nama..."
            className="max-w-xs"
          />

          <span className="text-sm text-muted-foreground">
            {terlihat.length} dari {daftar.length} mahasiswa
          </span>
        </div>

        <Card>
          <CardContent className="p-0">
            {daftar.length === 0 && !loading ? (
              <EmptyState
                icon={Users}
                title="Roster masih kosong"
                description="Tambahkan mahasiswa agar akun Google bisa ditautkan ke NIM."
                action={
                  <Button size="sm" onClick={bukaTambah}>
                    <Plus className="size-4" />
                    Tambah Mahasiswa
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">NIM</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="w-32">Kelas</TableHead>
                      <TableHead className="w-28">Angkatan</TableHead>
                      <TableHead className="w-28" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {terlihat.map((item) => (
                      <TableRow key={item.nim}>
                        <TableCell className="tnum">{item.nim}</TableCell>

                        <TableCell className="font-medium">
                          {item.nama}
                        </TableCell>

                        <TableCell>
                          {item.kelasPraktikum === "-" ? (
                            <span className="text-muted-foreground">
                              Belum ditetapkan
                            </span>
                          ) : (
                            `Kelas ${item.kelasPraktikum}`
                          )}
                        </TableCell>

                        <TableCell>{item.angkatan}</TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Ubah ${item.nama}`}
                              onClick={() => bukaUbah(item)}
                            >
                              <Pencil className="size-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Keluarkan ${item.nama}`}
                              onClick={() => setAkanDikeluarkan(item)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!loading && daftar.length > 0 && terlihat.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Tidak ada mahasiswa yang cocok dengan &quot;{cari}&quot;.
              </p>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">
            {editor?.mode === "ubah" ? "Ubah Mahasiswa" : "Tambah Mahasiswa"}
          </DialogTitle>

          <div className="mt-5 space-y-5">
            <Field>
              <FieldLabel htmlFor="nim">NIM</FieldLabel>
              <Input
                id="nim"
                value={form.nim}
                readOnly={editor?.mode === "ubah"}
                onChange={(event) =>
                  setForm((old) => ({ ...old, nim: event.target.value }))
                }
                placeholder="21030123140001"
              />
              {editor?.mode === "ubah" && (
                <FieldDescription>
                  NIM tidak bisa diubah karena menjadi acuan pengumpulan dan
                  tautan akun. Keluarkan lalu tambahkan ulang bila memang salah.
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="nama">Nama</FieldLabel>
              <Input
                id="nama"
                value={form.nama}
                onChange={(event) =>
                  setForm((old) => ({ ...old, nama: event.target.value }))
                }
                placeholder="Nama lengkap"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="kelas">Kelas Praktikum</FieldLabel>
              <Select
                value={form.kelas}
                onValueChange={(nilai) =>
                  setForm((old) => ({ ...old, kelas: nilai ?? "" }))
                }
              >
                <SelectTrigger id="kelas">
                  <SelectValue placeholder="Belum ditetapkan" />
                </SelectTrigger>
                <SelectContent>
                  {master.kelasPraktikum.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.nama}>
                      Kelas {kelas.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Satu kelas berlaku untuk seluruh mata kuliah.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="angkatan">Angkatan</FieldLabel>
              <Select
                value={form.angkatan}
                onValueChange={(nilai) =>
                  setForm((old) => ({ ...old, angkatan: nilai ?? "" }))
                }
              >
                <SelectTrigger id="angkatan">
                  <SelectValue placeholder="Pilih angkatan" />
                </SelectTrigger>
                <SelectContent>
                  {master.angkatan.map((item) => (
                    <SelectItem key={item.id} value={item.tahun}>
                      {item.tahun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditor(null)}
              disabled={menyimpan}
            >
              Batal
            </Button>

            <Button
              onClick={() => void simpan()}
              disabled={menyimpan || !bolehSimpan}
            >
              {menyimpan ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pratinjau !== null}
        onOpenChange={(open) => {
          if (!open && !mengimpor) setPratinjau(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="text-lg font-semibold">
            Pratinjau Impor
          </DialogTitle>

          <p className="mt-1 truncate text-sm text-muted-foreground">
            {pratinjau?.berkas}
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-md border px-4 py-3">
              <p className="text-2xl font-semibold tnum">
                {pratinjau?.siap.length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                baris siap diimpor. NIM yang sudah ada di roster akan
                diperbarui, bukan diduplikasi.
              </p>
            </div>

            {pratinjau && pratinjau.siap.length > 0 && (
              <div className="rounded-md border">
                <p className="border-b px-4 py-2 text-xs text-muted-foreground">
                  Tiga baris pertama
                </p>
                <ul className="divide-y text-sm">
                  {pratinjau.siap.slice(0, 3).map((item) => (
                    <li key={item.nim} className="px-4 py-2">
                      <span className="tnum text-muted-foreground">
                        {item.nim}
                      </span>{" "}
                      {item.nama}
                      <span className="text-muted-foreground">
                        {" "}
                        &middot; {item.kelas ?? "tanpa kelas"} &middot;{" "}
                        {item.angkatan}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pratinjau && pratinjau.masalah.length > 0 && (
              <div className="rounded-md border border-destructive/40 px-4 py-3">
                <p className="text-sm font-medium">
                  {pratinjau.masalah.length} baris dilewati
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {pratinjau.masalah.slice(0, 5).map((pesan) => (
                    <li key={pesan}>{pesan}</li>
                  ))}
                  {pratinjau.masalah.length > 5 && (
                    <li>dan {pratinjau.masalah.length - 5} lainnya</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPratinjau(null)}
              disabled={mengimpor}
            >
              Batal
            </Button>

            <Button
              onClick={() => void jalankanImpor()}
              disabled={mengimpor || (pratinjau?.siap.length ?? 0) === 0}
            >
              {mengimpor ? "Mengimpor..." : "Impor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={akanDikeluarkan !== null}
        onOpenChange={(open) => {
          if (!open) setAkanDikeluarkan(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluarkan dari roster?</AlertDialogTitle>
            <AlertDialogDescription>
              {akanDikeluarkan?.nama} ({akanDikeluarkan?.nim}) tidak akan lagi
              muncul di rekap, dan akun Google yang tertaut padanya menjadi
              terlepas. Mahasiswa yang masih punya pengumpulan tidak bisa
              dikeluarkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (akanDikeluarkan) void keluarkan(akanDikeluarkan);
              }}
            >
              Keluarkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

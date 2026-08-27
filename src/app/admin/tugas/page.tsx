"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import {
  BookOpen,
  Eye,
  FileText,
  GraduationCap,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import { Navbar } from "@/components/navbar";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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

import { EmptyState } from "@/components/common/empty-state";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { TenggatPicker } from "@/components/tenggat-picker";
import { TenggatText } from "@/components/tenggat-text";
import { useMasterData } from "@/hooks/use-master-data";
import { createMasterDataId, type Tugas } from "@/lib/master-data";
import { tenggatFromInput, tenggatToInput } from "@/lib/tenggat";
import { cn } from "@/lib/utils";

type Section = "tugas" | "akademik";

type EditorKind = "mataKuliah" | "tugas" | "kelas" | "angkatan";

type Editor = {
  kind: EditorKind;
  mode: "create" | "edit";
  id?: string;
};

type DeleteTarget = {
  kind: EditorKind;
  id: string;
  label: string;
};

const LABEL_EDITOR: Record<EditorKind, string> = {
  mataKuliah: "Mata Kuliah",
  tugas: "Tugas",
  kelas: "Kelas Praktikum",
  angkatan: "Angkatan",
};

const UKURAN_RUBRIK_MAKS = 2 * 1024 * 1024;

function RowActions({
  label,
  onEdit,
  onDelete,
  children,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  children?: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8"
        )}
        aria-label={`Aksi untuk ${label}`}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {children}

        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onDelete}>
          <Trash2 className="size-4" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function KolomTeks({
  id,
  label,
  hint,
  ...props
}: {
  id: string;
  label: string;
  hint?: string;
} & ComponentProps<typeof Input>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <Input id={id} {...props} />

      {hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  );
}

function AksiDialog({
  onCancel,
  onSave,
  saveLabel = "Simpan",
}: {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel}>
        Batal
      </Button>

      <Button onClick={onSave}>{saveLabel}</Button>
    </div>
  );
}

export default function AdminTugasPage() {
  const { data, setMasterData } = useMasterData();

  const [section, setSection] = useState<Section>("tugas");
  const [activeMataKuliahId, setActiveMataKuliahId] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [rubrikPreview, setRubrikPreview] = useState<Tugas | null>(null);

  const [mataKuliahForm, setMataKuliahForm] = useState({ nama: "" });
  const [kelasForm, setKelasForm] = useState({ nama: "" });
  const [angkatanForm, setAngkatanForm] = useState({ tahun: "" });

  const [tugasForm, setTugasForm] = useState({
    mataKuliahId: "",
    nomor: "",
    judul: "",
    tenggat: "",
    rubrikFileName: null as string | null,
    rubrikText: null as string | null,
  });

  const activeMataKuliah =
    data.mataKuliah.find((item) => item.id === activeMataKuliahId) ??
    data.mataKuliah[0] ??
    null;

  const activeTugas = data.tugas
    .filter((item) => item.mataKuliahId === activeMataKuliah?.id)
    .sort((a, b) => a.nomor - b.nomor);

  const angkatanTerurut = [...data.angkatan].sort(
    (a, b) => Number(b.tahun) - Number(a.tahun)
  );

  function editingId(kind: EditorKind) {
    return editor?.kind === kind && editor.mode === "edit"
      ? (editor.id ?? null)
      : null;
  }

  function openCreateMataKuliah() {
    setMataKuliahForm({ nama: "" });
    setEditor({ kind: "mataKuliah", mode: "create" });
  }

  function openEditMataKuliah(id: string) {
    const item = data.mataKuliah.find((mk) => mk.id === id);

    if (!item) return;

    setMataKuliahForm({ nama: item.nama });
    setEditor({ kind: "mataKuliah", mode: "edit", id });
  }

  function saveMataKuliah() {
    const nama = mataKuliahForm.nama.trim();

    if (nama.length < 3) {
      toast.error("Nama mata kuliah minimal 3 karakter.");
      return;
    }

    const duplicate = data.mataKuliah.some(
      (item) =>
        item.nama.toLowerCase() === nama.toLowerCase() && item.id !== editor?.id
    );

    if (duplicate) {
      toast.error("Mata kuliah tersebut sudah ada.");
      return;
    }

    const id = editingId("mataKuliah");

    if (id) {
      setMasterData((current) => ({
        ...current,
        mataKuliah: current.mataKuliah.map((item) =>
          item.id === id ? { ...item, nama } : item
        ),
      }));

      toast.success("Mata kuliah berhasil diperbarui.");
    } else {
      const baru = createMasterDataId("mk");

      setMasterData((current) => ({
        ...current,
        mataKuliah: [...current.mataKuliah, { id: baru, nama }],
      }));

      setActiveMataKuliahId(baru);

      toast.success("Mata kuliah berhasil ditambahkan.");
    }

    setEditor(null);
  }

  function openCreateTugas() {
    if (!activeMataKuliah) {
      toast.error("Tambahkan mata kuliah terlebih dahulu.");
      return;
    }

    const nextNomor =
      activeTugas.length > 0
        ? Math.max(...activeTugas.map((item) => item.nomor)) + 1
        : 1;

    setTugasForm({
      mataKuliahId: activeMataKuliah.id,
      nomor: String(nextNomor),
      judul: "",
      tenggat: "",
      rubrikFileName: null,
      rubrikText: null,
    });

    setEditor({ kind: "tugas", mode: "create" });
  }

  function openEditTugas(tugas: Tugas) {
    setTugasForm({
      mataKuliahId: tugas.mataKuliahId,
      nomor: String(tugas.nomor),
      judul: tugas.judul,
      tenggat: tenggatToInput(tugas.tenggat),
      rubrikFileName: tugas.rubrikFileName,
      rubrikText: tugas.rubrikText,
    });

    setEditor({ kind: "tugas", mode: "edit", id: tugas.id });
  }

  function saveTugas() {
    const nomor = Number(tugasForm.nomor);
    const judul = tugasForm.judul.trim();

    if (!Number.isInteger(nomor) || nomor < 1) {
      toast.error("Nomor tugas harus minimal 1.");
      return;
    }

    if (judul.length < 3) {
      toast.error("Judul tugas minimal 3 karakter.");
      return;
    }

    const tenggat = tenggatFromInput(tugasForm.tenggat);

    if (tugasForm.tenggat.trim() && tenggat === null) {
      toast.error("Tenggat pengumpulan tidak valid.");
      return;
    }

    const duplicate = data.tugas.some(
      (item) =>
        item.mataKuliahId === tugasForm.mataKuliahId &&
        item.nomor === nomor &&
        item.id !== editor?.id
    );

    if (duplicate) {
      toast.error(`Tugas ${nomor} sudah ada pada mata kuliah ini.`);
      return;
    }

    const id = editingId("tugas");

    if (id) {
      setMasterData((current) => ({
        ...current,
        tugas: current.tugas.map((item) =>
          item.id === id
            ? {
                ...item,
                nomor,
                judul,
                tenggat,
                rubrikFileName: tugasForm.rubrikFileName,
                rubrikText: tugasForm.rubrikText,
              }
            : item
        ),
      }));

      toast.success("Tugas berhasil diperbarui.");
    } else {
      setMasterData((current) => ({
        ...current,
        tugas: [
          ...current.tugas,
          {
            id: createMasterDataId("tugas"),
            mataKuliahId: tugasForm.mataKuliahId,
            nomor,
            judul,
            tenggat,
            rubrikFileName: tugasForm.rubrikFileName,
            rubrikText: tugasForm.rubrikText,
          },
        ],
      }));

      toast.success("Tugas berhasil ditambahkan.");
    }

    setEditor(null);
  }

  async function handleRubrikFile(file: File | undefined) {
    if (!file) return;

    const validType =
      file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain";

    if (!validType) {
      toast.error("Rubrik harus berupa file .txt.");
      return;
    }

    if (file.size > UKURAN_RUBRIK_MAKS) {
      toast.error("Ukuran file maksimal 2 MB.");
      return;
    }

    try {
      const text = await file.text();

      if (!text.trim()) {
        toast.error("File rubrik kosong.");
        return;
      }

      setTugasForm((current) => ({
        ...current,
        rubrikFileName: file.name,
        rubrikText: text,
      }));

      toast.success("Rubrik berhasil dibaca.");
    } catch {
      toast.error("Gagal membaca file rubrik.");
    }
  }

  function openCreateKelas() {
    setKelasForm({ nama: "" });
    setEditor({ kind: "kelas", mode: "create" });
  }

  function openEditKelas(id: string) {
    const item = data.kelasPraktikum.find((kelas) => kelas.id === id);

    if (!item) return;

    setKelasForm({ nama: item.nama });
    setEditor({ kind: "kelas", mode: "edit", id });
  }

  function saveKelas() {
    const nama = kelasForm.nama.trim().toUpperCase();

    if (!nama) {
      toast.error("Nama kelas tidak boleh kosong.");
      return;
    }

    const duplicate = data.kelasPraktikum.some(
      (item) =>
        item.nama.toLowerCase() === nama.toLowerCase() && item.id !== editor?.id
    );

    if (duplicate) {
      toast.error("Kelas tersebut sudah ada.");
      return;
    }

    const id = editingId("kelas");

    if (id) {
      setMasterData((current) => ({
        ...current,
        kelasPraktikum: current.kelasPraktikum.map((item) =>
          item.id === id ? { ...item, nama } : item
        ),
      }));

      toast.success("Kelas berhasil diperbarui.");
    } else {
      setMasterData((current) => ({
        ...current,
        kelasPraktikum: [
          ...current.kelasPraktikum,
          { id: createMasterDataId("kelas"), nama },
        ],
      }));

      toast.success("Kelas berhasil ditambahkan.");
    }

    setEditor(null);
  }

  function openCreateAngkatan() {
    setAngkatanForm({ tahun: "" });
    setEditor({ kind: "angkatan", mode: "create" });
  }

  function openEditAngkatan(id: string) {
    const item = data.angkatan.find((angkatan) => angkatan.id === id);

    if (!item) return;

    setAngkatanForm({ tahun: item.tahun });
    setEditor({ kind: "angkatan", mode: "edit", id });
  }

  function saveAngkatan() {
    const tahun = angkatanForm.tahun.trim();

    if (!/^\d{4}$/.test(tahun)) {
      toast.error("Angkatan harus berupa tahun 4 digit.");
      return;
    }

    const duplicate = data.angkatan.some(
      (item) => item.tahun === tahun && item.id !== editor?.id
    );

    if (duplicate) {
      toast.error("Angkatan tersebut sudah ada.");
      return;
    }

    const id = editingId("angkatan");

    if (id) {
      setMasterData((current) => ({
        ...current,
        angkatan: current.angkatan.map((item) =>
          item.id === id ? { ...item, tahun } : item
        ),
      }));

      toast.success("Angkatan berhasil diperbarui.");
    } else {
      setMasterData((current) => ({
        ...current,
        angkatan: [
          ...current.angkatan,
          { id: createMasterDataId("angkatan"), tahun },
        ],
      }));

      toast.success("Angkatan berhasil ditambahkan.");
    }

    setEditor(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    const { kind, id } = deleteTarget;

    setMasterData((current) => {
      switch (kind) {
        case "mataKuliah":
          return {
            ...current,
            mataKuliah: current.mataKuliah.filter((item) => item.id !== id),
            tugas: current.tugas.filter((item) => item.mataKuliahId !== id),
          };

        case "tugas":
          return {
            ...current,
            tugas: current.tugas.filter((item) => item.id !== id),
          };

        case "kelas":
          return {
            ...current,
            kelasPraktikum: current.kelasPraktikum.filter(
              (item) => item.id !== id
            ),
          };

        case "angkatan":
          return {
            ...current,
            angkatan: current.angkatan.filter((item) => item.id !== id),
          };
      }
    });

    toast.success("Data berhasil dihapus.");

    setDeleteTarget(null);
  }

  const relatedTaskCount =
    deleteTarget?.kind === "mataKuliah"
      ? data.tugas.filter((item) => item.mataKuliahId === deleteTarget.id)
          .length
      : 0;

  const simpanEditor: Record<EditorKind, () => void> = {
    mataKuliah: saveMataKuliah,
    tugas: saveTugas,
    kelas: saveKelas,
    angkatan: saveAngkatan,
  };

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <PageHeader
          title="Pengaturan Tugas"
          description="Kelola mata kuliah, tugas, rubrik, kelas praktikum, dan angkatan yang digunakan oleh mahasiswa."
        />

        <Tabs
          value={section}
          onValueChange={(value) => setSection(value as Section)}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="tugas">
              <BookOpen className="size-4" />
              Mata Kuliah &amp; Tugas
            </TabsTrigger>

            <TabsTrigger value="akademik">
              <GraduationCap className="size-4" />
              Data Akademik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tugas">
          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Mata Kuliah</CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Pilih mata kuliah untuk mengatur tugasnya.
                  </p>
                </div>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={openCreateMataKuliah}
                  aria-label="Tambah mata kuliah"
                >
                  <Plus className="size-4" />
                </Button>
              </CardHeader>

              <CardContent className="space-y-2">
                {data.mataKuliah.length === 0 && (
                  <EmptyState
                    className="border"
                    title="Belum ada mata kuliah"
                    description="Tambahkan mata kuliah pertama untuk mulai membuat tugas."
                    action={
                      <Button size="sm" onClick={openCreateMataKuliah}>
                        <Plus className="size-4" />
                        Tambah Mata Kuliah
                      </Button>
                    }
                  />
                )}

                <ItemGroup className="gap-2">
                  {data.mataKuliah.map((mk) => {
                    const jumlahTugas = data.tugas.filter(
                      (tugas) => tugas.mataKuliahId === mk.id
                    ).length;

                    const active = activeMataKuliah?.id === mk.id;

                    return (
                      <Item
                        key={mk.id}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "relative has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                          active && "border-foreground/20 bg-muted/60"
                        )}
                      >
                        <ItemContent className="min-w-0">
                          <ItemTitle className="max-w-full">
                            <button
                              type="button"
                              className="truncate text-left after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
                              onClick={() => setActiveMataKuliahId(mk.id)}
                            >
                              {mk.nama}
                            </button>
                          </ItemTitle>

                          <ItemDescription className="text-xs">
                            {jumlahTugas} tugas
                          </ItemDescription>
                        </ItemContent>

                        <ItemActions className="relative">
                          <RowActions
                            label={mk.nama}
                            onEdit={() => openEditMataKuliah(mk.id)}
                            onDelete={() =>
                              setDeleteTarget({
                                kind: "mataKuliah",
                                id: mk.id,
                                label: mk.nama,
                              })
                            }
                          />
                        </ItemActions>
                      </Item>
                    );
                  })}
                </ItemGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    {activeMataKuliah ? activeMataKuliah.nama : "Daftar Tugas"}
                  </CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeMataKuliah
                      ? `${activeTugas.length} tugas tersedia`
                      : "Pilih mata kuliah terlebih dahulu."}
                  </p>
                </div>

                <Button
                  size="sm"
                  disabled={!activeMataKuliah}
                  onClick={openCreateTugas}
                >
                  <Plus className="size-4" />
                  Tambah Tugas
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                {!activeMataKuliah ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    Pilih mata kuliah untuk melihat tugas.
                  </div>
                ) : activeTugas.length === 0 ? (
                  <EmptyState
                    className="px-6 py-14"
                    title="Belum ada tugas"
                    description="Tambahkan tugas pertama untuk mata kuliah ini."
                    action={
                      <Button size="sm" onClick={openCreateTugas}>
                        <Plus className="size-4" />
                        Tambah Tugas
                      </Button>
                    }
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Tugas</TableHead>
                        <TableHead>Judul</TableHead>
                        <TableHead>Tenggat</TableHead>
                        <TableHead>Rubrik</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {activeTugas.map((tugas) => (
                        <TableRow key={tugas.id}>
                          <TableCell>Tugas {tugas.nomor}</TableCell>

                          <TableCell className="font-medium">
                            {tugas.judul}
                          </TableCell>

                          <TableCell>
                            <TenggatText tenggat={tugas.tenggat} />
                          </TableCell>

                          <TableCell>
                            {tugas.rubrikFileName ? (
                              <Badge variant="outline" className="gap-1.5">
                                <FileText className="size-3" />
                                Rubrik tersedia
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Belum ada
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <RowActions
                              label={`Tugas ${tugas.nomor}`}
                              onEdit={() => openEditTugas(tugas)}
                              onDelete={() =>
                                setDeleteTarget({
                                  kind: "tugas",
                                  id: tugas.id,
                                  label: `Tugas ${tugas.nomor} — ${tugas.judul}`,
                                })
                              }
                            >
                              <DropdownMenuItem
                                disabled={!tugas.rubrikText}
                                onClick={() => setRubrikPreview(tugas)}
                              >
                                <Eye className="size-4" />
                                Lihat Rubrik
                              </DropdownMenuItem>
                            </RowActions>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
          </TabsContent>

          <TabsContent value="akademik">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Kelas Praktikum</CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Digunakan pada profil mahasiswa.
                  </p>
                </div>

                <Button size="sm" onClick={openCreateKelas}>
                  <Plus className="size-4" />
                  Tambah
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kelas</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data.kelasPraktikum.map((kelas) => (
                      <TableRow key={kelas.id}>
                        <TableCell className="font-medium">
                          Kelas {kelas.nama}
                        </TableCell>

                        <TableCell>
                          <RowActions
                            label={`Kelas ${kelas.nama}`}
                            onEdit={() => openEditKelas(kelas.id)}
                            onDelete={() =>
                              setDeleteTarget({
                                kind: "kelas",
                                id: kelas.id,
                                label: `Kelas ${kelas.nama}`,
                              })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}

                    {data.kelasPraktikum.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <EmptyState
                            className="py-8"
                            title="Belum ada kelas."
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Angkatan</CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Tahun angkatan yang dapat dipilih mahasiswa.
                  </p>
                </div>

                <Button size="sm" onClick={openCreateAngkatan}>
                  <Plus className="size-4" />
                  Tambah
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tahun</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {angkatanTerurut.map((angkatan) => (
                      <TableRow key={angkatan.id}>
                        <TableCell className="font-medium">
                          {angkatan.tahun}
                        </TableCell>

                        <TableCell>
                          <RowActions
                            label={`Angkatan ${angkatan.tahun}`}
                            onEdit={() => openEditAngkatan(angkatan.id)}
                            onDelete={() =>
                              setDeleteTarget({
                                kind: "angkatan",
                                id: angkatan.id,
                                label: angkatan.tahun,
                              })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}

                    {angkatanTerurut.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <EmptyState
                            className="py-8"
                            title="Belum ada angkatan."
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog
        open={!!editor}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {editor && (
            <>
              <DialogTitle>
                {editor.mode === "create" ? "Tambah" : "Edit"}{" "}
                {LABEL_EDITOR[editor.kind]}
              </DialogTitle>

              <div className="space-y-5 pt-2">
                {editor.kind === "mataKuliah" && (
                  <KolomTeks
                    id="namaMataKuliah"
                    label="Nama Mata Kuliah"
                    placeholder="Praktikum Alpro"
                    value={mataKuliahForm.nama}
                    onChange={(event) =>
                      setMataKuliahForm({ nama: event.target.value })
                    }
                    autoFocus
                  />
                )}

                {editor.kind === "kelas" && (
                  <KolomTeks
                    id="namaKelas"
                    label="Nama Kelas"
                    placeholder="A"
                    value={kelasForm.nama}
                    onChange={(event) =>
                      setKelasForm({ nama: event.target.value })
                    }
                    autoFocus
                  />
                )}

                {editor.kind === "angkatan" && (
                  <KolomTeks
                    id="tahunAngkatan"
                    label="Tahun Angkatan"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="2026"
                    value={angkatanForm.tahun}
                    onChange={(event) =>
                      setAngkatanForm({
                        tahun: event.target.value.replace(/\D/g, ""),
                      })
                    }
                    autoFocus
                  />
                )}

                {editor.kind === "tugas" && (
                  <>
                    <div className="grid grid-cols-[110px_1fr] gap-4">
                      <KolomTeks
                        id="nomorTugas"
                        label="Tugas ke-"
                        type="number"
                        min={1}
                        value={tugasForm.nomor}
                        onChange={(event) =>
                          setTugasForm((current) => ({
                            ...current,
                            nomor: event.target.value,
                          }))
                        }
                      />

                      <KolomTeks
                        id="judulTugas"
                        label="Judul Tugas"
                        placeholder="Variabel dan Tipe Data"
                        value={tugasForm.judul}
                        onChange={(event) =>
                          setTugasForm((current) => ({
                            ...current,
                            judul: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <TenggatPicker
                      id="tenggatTugas"
                      label="Tenggat Pengumpulan"
                      value={tugasForm.tenggat}
                      onChange={(tenggat) =>
                        setTugasForm((current) => ({ ...current, tenggat }))
                      }
                      hint="Waktu WIB. Kosongkan bila tugas ini tanpa batas waktu."
                    />

                    <Field>
                      <FieldLabel htmlFor="rubrikFile">File Rubrik</FieldLabel>

                      <Input
                        id="rubrikFile"
                        type="file"
                        accept=".txt,text/plain"
                        onChange={(event) =>
                          void handleRubrikFile(event.target.files?.[0])
                        }
                      />

                      <FieldDescription>
                        Format .txt, maksimal 2 MB.
                      </FieldDescription>

                      {tugasForm.rubrikFileName && (
                        <Item variant="muted" size="sm">
                          <ItemMedia variant="icon">
                            <FileText />
                          </ItemMedia>

                          <ItemContent className="min-w-0">
                            <ItemTitle className="max-w-full truncate">
                              {tugasForm.rubrikFileName}
                            </ItemTitle>
                          </ItemContent>

                          <ItemActions>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setTugasForm((current) => ({
                                  ...current,
                                  rubrikFileName: null,
                                  rubrikText: null,
                                }))
                              }
                            >
                              Hapus
                            </Button>
                          </ItemActions>
                        </Item>
                      )}
                    </Field>

                    {tugasForm.rubrikText && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Preview</p>

                        <div className="max-h-40 overflow-y-auto rounded-md border bg-muted p-3">
                          <pre className="whitespace-pre-wrap wrap-break-word font-mono text-xs leading-relaxed">
                            {tugasForm.rubrikText}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <AksiDialog
                  onCancel={() => setEditor(null)}
                  onSave={simpanEditor[editor.kind]}
                  saveLabel={editor.kind === "tugas" ? "Simpan Tugas" : "Simpan"}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data?</AlertDialogTitle>

            <AlertDialogDescription>
              Anda akan menghapus{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.label}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteTarget?.kind === "mataKuliah" && relatedTaskCount > 0 && (
            <div className="rounded-md border p-3 text-sm">
              Mata kuliah ini memiliki <strong>{relatedTaskCount} tugas</strong>
              . Tugas yang terkait juga akan dihapus.
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>

            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              <Trash2 className="size-4" />
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!rubrikPreview}
        onOpenChange={(open) => {
          if (!open) setRubrikPreview(null);
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-3xl">
          <DialogTitle>Rubrik — Tugas {rubrikPreview?.nomor}</DialogTitle>

          {rubrikPreview && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div>
                <p className="font-medium">{rubrikPreview.judul}</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {rubrikPreview.rubrikFileName}
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto rounded-md border bg-muted p-5">
                <pre className="whitespace-pre-wrap wrap-break-word font-mono text-sm leading-relaxed">
                  {rubrikPreview.rubrikText}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

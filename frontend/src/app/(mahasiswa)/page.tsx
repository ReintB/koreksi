"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, LoaderCircle } from "lucide-react";
import { z } from "zod";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldError as FormFieldError,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Navbar } from "@/components/navbar";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { TenggatText } from "@/components/tenggat-text";
import { useMasterData } from "@/hooks/use-master-data";
import { useAuth } from "@/hooks/use-auth";
import { labelMataKuliah, type Tugas } from "@/lib/master-data";
import { tenggatInfo } from "@/lib/tenggat";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  nim: z.string().min(6, "Masukkan NIM yang terdaftar"),

  mataKuliahId: z.string().min(1, "Pilih mata kuliah terlebih dahulu"),

  tugasId: z.string().min(1, "Pilih tugas terlebih dahulu"),

  linkYoutube: z
    .url("Masukkan URL yang valid")
    .refine(
      (url) => url.includes("youtube.com") || url.includes("youtu.be"),
      "Link harus berasal dari YouTube"
    ),

  linkDrive: z
    .url("Masukkan URL yang valid")
    .refine(
      (url) => url.includes("drive.google.com"),
      "Link harus berasal dari Google Drive"
    )
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const tugasLabel = (tugas: Tugas) => `Tugas ${tugas.nomor} — ${tugas.judul}`;

const KETERANGAN_YOUTUBE =
  "Video harus bersifat publik atau tidak terdaftar (unlisted), bukan privat, agar dapat diakses sistem.";

const KETERANGAN_DRIVE =
  'Sertakan materi atau file pendukung jika diperlukan. Atur akses berbagi ke "Siapa saja yang memiliki link" agar dapat diakses sistem.';

function LinkField({
  control,
  name,
  label,
  placeholder,
  description,
  error,
}: {
  control: Control<FormValues>;
  name: "linkYoutube" | "linkDrive";
  label: ReactNode;
  placeholder: string;
  description: string;
  error?: FormFieldError;
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>

      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            id={name}
            placeholder={placeholder}
            aria-invalid={!!error}
            {...field}
          />
        )}
      />

      <FieldDescription>{description}</FieldDescription>

      <FieldError errors={[error]} />
    </Field>
  );
}

export default function SubmitTugasPage() {
  const router = useRouter();
  const { data, isHydrated } = useMasterData();
  const { authenticated, user, loading: authLoading } = useAuth();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nim: "",
      mataKuliahId: "",
      tugasId: "",
      linkYoutube: "",
      linkDrive: "",
    },
  });

  const selectedMataKuliahId = useWatch({ control, name: "mataKuliahId" });
  const selectedTugasId = useWatch({ control, name: "tugasId" });

  const selectedMataKuliah =
    data.mataKuliah.find((item) => item.id === selectedMataKuliahId) ?? null;

  const selectedTugas =
    data.tugas.find((tugas) => tugas.id === selectedTugasId) ?? null;

  const tugasTersedia = selectedMataKuliahId
    ? data.tugas
        .filter((tugas) => tugas.mataKuliahId === selectedMataKuliahId)
        .sort((a, b) => a.nomor - b.nomor)
    : [];

  // Tiap angkatan mengambil praktikum yang berbeda, dan mata kuliah tanpa
  // angkatan berlaku untuk semua. Selama akun belum ditautkan ke roster
  // angkatannya belum diketahui; daftarnya ditampilkan apa adanya karena
  // pengiriman toh sudah tertahan oleh NIM yang kosong.
  const angkatanSaya = user?.student?.angkatan ?? null;

  const mataKuliahTersedia = angkatanSaya
    ? data.mataKuliah.filter(
        (item) => item.angkatan === null || item.angkatan === angkatanSaya
      )
    : data.mataKuliah;

  const mataKuliahPlaceholder =
    mataKuliahTersedia.length === 0
      ? angkatanSaya
        ? `Belum ada mata kuliah untuk angkatan ${angkatanSaya}`
        : "Belum ada mata kuliah"
      : "Pilih mata kuliah";

  const tenggatLewat =
    isHydrated && selectedTugas?.tenggat
      ? tenggatInfo(selectedTugas.tenggat).lewat
      : false;

  const tugasPlaceholder = !selectedMataKuliahId
    ? "Pilih mata kuliah terlebih dahulu"
    : tugasTersedia.length === 0
      ? "Belum ada tugas"
      : "Pilih tugas";

  useEffect(() => {
    queueMicrotask(() => setValue("nim", user?.student?.nim ?? ""));
  }, [setValue, user?.student?.nim]);

  async function onSubmit(values: FormValues) {
    try {
      await api("/submissions", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Tugas berhasil dikirim.", {
        description: "Pengumpulan masuk antrean dan akan diproses otomatis.",
        action: {
          label: "Lihat Riwayat",
          onClick: () => router.push("/riwayat"),
        },
      });
      reset({
        nim: values.nim.trim(),
        mataKuliahId: "",
        tugasId: "",
        linkYoutube: "",
        linkDrive: "",
      });
    } catch (error) {
      toast.error("Tugas gagal dikirim.", {
        description: error instanceof Error ? error.message : "Backend tidak merespons.",
      });
    }
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <PageHeader
          title="Kirim Tugas"
          description="Pilih mata kuliah dan tugas yang akan dikumpulkan, kemudian sertakan link video pengerjaan."
        />

        {!authLoading && !authenticated && (
          <p className="mb-4 rounded-md border p-3 text-sm text-muted-foreground">
            Silakan masuk dengan Google terlebih dahulu melalui menu Masuk.
          </p>
        )}
        {!authLoading && authenticated && !user?.student && (
          <p className="mb-4 rounded-md border p-3 text-sm text-muted-foreground">
            Akun Google sudah login, tetapi belum dihubungkan ke NIM. Hubungi admin agar akun dapat mengirim tugas.
          </p>
        )}

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field data-invalid={!!errors.nim}>
                  <FieldLabel htmlFor="nim">NIM</FieldLabel>
                  <Controller
                    control={control}
                    name="nim"
                    render={({ field }) => (
                      <Input
                        id="nim"
                        placeholder={authLoading ? "Memeriksa akun..." : "NIM belum dihubungkan admin"}
                        readOnly
                        {...field}
                      />
                    )}
                  />
                  <FieldDescription>
                    NIM diambil dari akun Google yang sudah dihubungkan admin ke roster PostgreSQL.
                  </FieldDescription>
                  <FieldError errors={[errors.nim]} />
                </Field>

                <Field data-invalid={!!errors.mataKuliahId}>
                  <FieldLabel htmlFor="mataKuliahId">Mata Kuliah</FieldLabel>

                  <Controller
                    control={control}
                    name="mataKuliahId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setValue("tugasId", "");
                        }}
                        disabled={!isHydrated || mataKuliahTersedia.length === 0}
                      >
                        <SelectTrigger id="mataKuliahId" className="w-full">
                          <span
                            className={cn(
                              "truncate",
                              !selectedMataKuliah && "text-muted-foreground"
                            )}
                          >
                            {selectedMataKuliah?.nama ?? mataKuliahPlaceholder}
                          </span>
                        </SelectTrigger>

                        <SelectContent>
                          {mataKuliahTersedia.map((mataKuliah) => (
                            <SelectItem
                              key={mataKuliah.id}
                              value={mataKuliah.id}
                            >
                              {labelMataKuliah(mataKuliah)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  <FieldError errors={[errors.mataKuliahId]} />
                </Field>

                <Field data-invalid={!!errors.tugasId}>
                  <FieldLabel htmlFor="tugasId">Tugas</FieldLabel>

                  <Controller
                    control={control}
                    name="tugasId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          !selectedMataKuliahId || tugasTersedia.length === 0
                        }
                      >
                        <SelectTrigger id="tugasId" className="w-full">
                          <span
                            className={cn(
                              "truncate",
                              !selectedTugas && "text-muted-foreground"
                            )}
                          >
                            {selectedTugas
                              ? tugasLabel(selectedTugas)
                              : tugasPlaceholder}
                          </span>
                        </SelectTrigger>

                        <SelectContent>
                          {tugasTersedia.map((tugas) => (
                            <SelectItem key={tugas.id} value={tugas.id}>
                              {tugasLabel(tugas)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />

                  <FieldError errors={[errors.tugasId]} />
                </Field>

                {selectedTugas && (
                  <div className="flex gap-3 rounded-md border bg-muted/30 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <ClipboardList className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {tugasLabel(selectedTugas)}
                      </p>

                      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                        Tenggat
                        <TenggatText
                          tenggat={selectedTugas.tenggat}
                          kosong="Tanpa batas waktu"
                          className="text-foreground"
                        />
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {tenggatLewat
                          ? "Tenggat sudah lewat. Tugas masih bisa dikirim, tetapi akan ditandai terlambat pada rekap asisten."
                          : "Pastikan video yang dikirim sesuai dengan tugas yang dipilih."}
                      </p>
                    </div>
                  </div>
                )}

                <LinkField
                  control={control}
                  name="linkYoutube"
                  label="Link Video YouTube"
                  placeholder="https://youtube.com/watch?v=..."
                  description={KETERANGAN_YOUTUBE}
                  error={errors.linkYoutube}
                />

                <LinkField
                  control={control}
                  name="linkDrive"
                  label={
                    <>
                      Link Google Drive{" "}
                      <span className="font-normal text-muted-foreground">
                        (opsional)
                      </span>
                    </>
                  }
                  placeholder="https://drive.google.com/..."
                  description={KETERANGAN_DRIVE}
                  error={errors.linkDrive}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !selectedTugasId || !authenticated || !user?.student}
                >
                  {isSubmitting && (
                    <LoaderCircle className="size-4 animate-spin" />
                  )}
                  {isSubmitting ? "Mengirim..." : "Kirim Tugas"}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

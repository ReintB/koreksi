"use client";

import type { ReactNode } from "react";
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
import type { Tugas } from "@/lib/master-data";
import { tenggatInfo } from "@/lib/tenggat";
import { cn } from "@/lib/utils";

const formSchema = z.object({
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

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

  const mataKuliahPlaceholder =
    data.mataKuliah.length === 0 ? "Belum ada mata kuliah" : "Pilih mata kuliah";

  const tenggatLewat =
    isHydrated && selectedTugas?.tenggat
      ? tenggatInfo(selectedTugas.tenggat).lewat
      : false;

  const tugasPlaceholder = !selectedMataKuliahId
    ? "Pilih mata kuliah terlebih dahulu"
    : tugasTersedia.length === 0
      ? "Belum ada tugas"
      : "Pilih tugas";

  function onSubmit(values: FormValues) {
    const mataKuliah = data.mataKuliah.find(
      (item) => item.id === values.mataKuliahId
    );

    const tugas = data.tugas.find((item) => item.id === values.tugasId);

    console.log({
      ...values,
      mataKuliah: mataKuliah?.nama,
      tugasKe: tugas?.nomor,
      judulTugas: tugas?.judul,
    });

    toast.success("Tugas berhasil dikirim.", {
      description: "Pengumpulan masuk antrean dan menunggu diproses.",
      action: {
        label: "Lihat Riwayat",
        onClick: () => router.push("/riwayat"),
      },
    });

    reset();
  }

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <PageHeader
          title="Kirim Tugas"
          description="Pilih mata kuliah dan tugas yang akan dikumpulkan, kemudian sertakan link video pengerjaan."
        />

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup>
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
                        disabled={!isHydrated || data.mataKuliah.length === 0}
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
                          {data.mataKuliah.map((mataKuliah) => (
                            <SelectItem
                              key={mataKuliah.id}
                              value={mataKuliah.id}
                            >
                              {mataKuliah.nama}
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
                  disabled={isSubmitting || !selectedTugasId}
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

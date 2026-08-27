import { GraduationCap, Mail, UserRound, Users } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

const fields = [
  {
    icon: UserRound,
    label: "Nama lengkap",
    hint: "Diambil dari akun Google",
  },
  {
    icon: Mail,
    label: "Email",
    hint: "Diambil dari akun Google",
  },
  {
    icon: Users,
    label: "Kelas praktikum",
    hint: "Ditetapkan asisten praktikum",
  },
  {
    icon: GraduationCap,
    label: "Angkatan",
    hint: "Ditetapkan asisten praktikum",
  },
];

export default function ProfilPage() {
  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <PageHeader
          title="Profil"
          description="Informasi akun yang dipakai saat mengirim tugas."
        />

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-4 border-b px-6 py-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserRound className="size-6 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <p className="font-medium text-muted-foreground">
                  Belum masuk
                </p>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  Masuk dengan Google untuk mengisi profil ini.
                </p>
              </div>
            </div>

            <dl className="divide-y">
              {fields.map((field) => (
                <div
                  key={field.label}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-6 py-4"
                >
                  <dt className="flex min-w-40 items-center gap-2 text-sm font-medium">
                    <field.icon className="size-4 shrink-0 text-muted-foreground" />
                    {field.label}
                  </dt>

                  <dd className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4">
                    <span className="text-sm text-muted-foreground/60">
                      Belum tersedia
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {field.hint}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

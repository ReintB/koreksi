"use client";

import { GraduationCap, Mail, UserRound, Users } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useStudentProfile } from "@/hooks/use-submissions";
import { useAuth } from "@/hooks/use-auth";
import { inisial } from "@/lib/inisial";

export default function ProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, loading } = useStudentProfile(user?.student?.nim ?? null);
  const kelas = profile
    ? profile.kelas ?? "Belum ditetapkan"
    : "Belum tersedia";

  // Nama roster lebih dipercaya daripada nama Google: itulah yang tertulis di
  // daftar peserta. Kosong berarti keduanya belum tiba, bukan berarti orangnya
  // tidak bernama.
  const namaTampil = profile?.nama ?? user?.name ?? "";

  const fields = [
    { icon: UserRound, label: "Nama lengkap", value: profile?.nama ?? user?.name ?? "Belum tersedia" },
    { icon: Mail, label: "Email Google", value: user?.email ?? "Belum tersedia" },
    { icon: Users, label: "Kelas praktikum", value: kelas },
    { icon: GraduationCap, label: "Angkatan", value: profile?.angkatan ?? "Belum tersedia" },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <PageHeader
          title="Profil"
          description="Informasi mahasiswa yang dipakai saat mengirim dan merekap tugas."
        />

        <Card>
          <CardContent className="p-0">
            <div className="flex items-center gap-4 border-b px-6 py-5">
              {/* Foto Google sudah tersimpan sejak login dan selama ini tidak
                  pernah ditampilkan di mana pun. Inisial dipakai bila akunnya
                  memang tidak berfoto, dan ikon generik hanya selama datanya
                  belum tiba — supaya tidak ada kedipan dari "?" ke nama asli. */}
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {user?.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="size-full object-cover"
                    // Tanpa ini Google membalas 403 untuk sebagian avatar.
                    referrerPolicy="no-referrer"
                  />
                ) : namaTampil ? (
                  <span className="text-sm font-medium text-muted-foreground">
                    {inisial(namaTampil, user?.email)}
                  </span>
                ) : (
                  <UserRound className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium">
                  {authLoading || loading ? "Memuat profil..." : profile?.nama ?? user?.name ?? "Belum login"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {profile ? `NIM ${profile.nim}` : user ? "Akun Google belum dihubungkan ke NIM oleh admin." : "Silakan masuk dengan Google."}
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
                  <dd className="flex-1 text-sm text-muted-foreground">
                    {field.value}
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

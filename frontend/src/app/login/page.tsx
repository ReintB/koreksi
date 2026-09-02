"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const langkah = [
  "Masuk memakai akun Google",
  "Admin menghubungkan akun ke NIM roster",
  "Kirim video YouTube untuk diproses otomatis",
  "Nilai, evaluasi rubrik, transkrip, dan DOCX tersimpan",
];

export default function LoginPage() {
  const { authenticated, user, loading } = useAuth();

  useEffect(() => {
    queueMicrotask(() => {
      const error = new URLSearchParams(window.location.search).get("error");
      if (error) toast.error("Login Google gagal. Silakan coba lagi.");
    });
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between border-r bg-muted/40 p-10 lg:flex xl:p-14">
        <span className="font-medium">Koreksi Tugas</span>
        <div>
          <h1 className="max-w-[16ch] text-3xl font-semibold leading-tight tracking-tight text-balance xl:text-4xl">
            Sistem koreksi otomatis tugas video praktikum
          </h1>
          <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
            Identitas pengguna diverifikasi Google. Materi, kelas, submission, nilai, dan hasil koreksi disimpan terpusat di PostgreSQL.
          </p>
          <ol className="mt-10 max-w-sm">
            {langkah.map((step, index) => (
              <li key={step} className="flex gap-4 border-t py-3 first:border-t-0">
                <span className="tnum w-4 shrink-0 text-sm font-medium text-muted-foreground">{index + 1}</span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-muted-foreground">Teknologi Rekayasa Otomasi</p>
      </div>
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <span className="font-medium">Koreksi Tugas</span>
          </div>
          <h2 className="mb-1 text-2xl font-semibold tracking-tight">Masuk</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Gunakan akun Google untuk masuk ke sistem koreksi.
          </p>

          {authenticated && user ? (
            <div className="rounded-lg border p-4">
              <p className="font-medium">{user.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Role: {user.role === "admin" ? "Admin" : "Mahasiswa"}
                {user.student ? ` · NIM ${user.student.nim}` : " · NIM belum dihubungkan admin"}
              </p>
              <Link
                href={user.role === "admin" ? "/admin" : "/"}
                className={cn(buttonVariants(), "mt-4 w-full")}
              >
                Lanjut ke Sistem
              </Link>
            </div>
          ) : (
            <>
              <a
                href="/api/auth/google/login?next=/"
                className={cn(buttonVariants(), "w-full")}
              >
                <LogIn className="size-4" />
                {loading ? "Memeriksa sesi..." : "Masuk dengan Google"}
              </a>
              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                Akun baru akan muncul di halaman Admin → Pengguna. Admin menghubungkan akun mahasiswa ke NIM roster sebelum pengumpulan tugas dapat dilakukan.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

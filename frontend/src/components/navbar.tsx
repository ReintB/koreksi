"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import ModeToggle from "@/components/mode-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { logout, useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const mahasiswaNavigation = [
  {
    href: "/",
    label: "Kirim Tugas",
  },
  {
    href: "/riwayat",
    label: "Riwayat",
  },
  {
    href: "/profil",
    label: "Profil",
  },
];

const adminNavigation = [
  {
    href: "/admin",
    label: "Submission",
  },
  {
    href: "/admin/rekap",
    label: "Rekap Kelas",
  },
  {
    href: "/admin/tugas",
    label: "Pengaturan Tugas",
  },
  {
    href: "/admin/mahasiswa",
    label: "Mahasiswa",
  },
  {
    href: "/admin/pengguna",
    label: "Pengguna",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated, user } = useAuth();

  // Dua hal berbeda yang sebelumnya tertukar: `diAreaAdmin` soal halaman yang
  // sedang dibuka, `admin` soal hak akses akunnya.
  const diAreaAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const admin = user?.role === "admin";

  // Menu mengikuti area yang sedang dibuka, lalu admin mendapat satu tautan
  // tambahan untuk berpindah area. Tanpa ini admin yang berada di halaman
  // mahasiswa tidak punya jalan ke /admin selain mengetik URL sendiri.
  const navigation = [
    ...(diAreaAdmin ? adminNavigation : mahasiswaNavigation),
    ...(admin
      ? [
          diAreaAdmin
            ? { href: "/", label: "Area Mahasiswa" }
            : { href: "/admin", label: "Area Admin" },
        ]
      : []),
  ];

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link
          href={diAreaAdmin ? "/admin" : "/"}
          className="shrink-0 font-semibold"
        >
          Koreksi Tugas
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  active ? "page" : undefined
                }
                className={cn(
                  "shrink-0 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {authenticated && user ? (
          <>
            <span className="hidden max-w-44 truncate text-xs text-muted-foreground lg:block">
              {user.email} · {user.role === "admin" ? "Admin" : "Mahasiswa"}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Keluar"
              onClick={() => void logout().then(() => { router.push("/login"); router.refresh(); })}
            >
              <LogOut className="size-4" />
            </Button>
          </>
        ) : (
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Masuk
          </Link>
        )}
        <ModeToggle />
      </div>
    </header>
  );
}
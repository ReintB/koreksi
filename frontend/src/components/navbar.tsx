"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import ModeToggle from "@/components/mode-toggle";
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
];

export function Navbar() {
  const pathname = usePathname();

  const isAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const navigation = isAdmin
    ? adminNavigation
    : mahasiswaNavigation;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link
          href={isAdmin ? "/admin" : "/"}
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

        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
          {isAdmin ? "Admin" : "Mahasiswa"}
        </span>
        <ModeToggle />
      </div>
    </header>
  );
}
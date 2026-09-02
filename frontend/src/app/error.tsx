"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";

import { MessagePage } from "@/components/common/message-page";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <MessagePage
      icon={TriangleAlert}
      tone="danger"
      title="Halaman gagal dimuat"
      description="Terjadi kesalahan saat menyiapkan halaman ini. Coba muat ulang — kalau masih gagal, laporkan ke asisten praktikum beserta kode di bawah."
      actions={
        <>
          <Button onClick={reset}>
            <RotateCw className="size-4" />
            Muat ulang
          </Button>

          <Link
            href="/"
            className={buttonVariants({ variant: "outline" })}
          >
            Kembali ke Kirim Tugas
          </Link>
        </>
      }
    >
      {error.digest && (
        <p className="tnum mt-4 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          Kode kesalahan: {error.digest}
        </p>
      )}
    </MessagePage>
  );
}

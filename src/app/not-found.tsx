import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { MessagePage } from "@/components/common/message-page";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Halaman tidak ditemukan",
};

export default function NotFound() {
  return (
    <MessagePage
      icon={FileQuestion}
      title="Halaman tidak ditemukan"
      description="Alamat yang kamu buka tidak ada. Mungkin tautannya salah ketik, atau halamannya sudah dipindahkan."
      actions={
        <>
          <Link href="/" className={buttonVariants()}>
            Kirim Tugas
          </Link>

          <Link
            href="/riwayat"
            className={buttonVariants({ variant: "outline" })}
          >
            Riwayat Pengumpulan
          </Link>
        </>
      }
    />
  );
}

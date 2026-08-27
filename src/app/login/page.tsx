"use client";

import { Button } from "@/components/ui/button";

const langkah = [
  "Kirim link video pengerjaan",
  "Sistem menyalin video jadi transkrip",
  "Transkrip dicocokkan dengan rubrik",
  "Skor dan cakupan materi terbit",
];

export default function LoginPage() {
  function handleGoogleLogin() {
    console.log("Login dengan Google diklik");
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between border-r bg-muted/40 p-10 lg:flex xl:p-14">
        <span className="font-medium">Koreksi Tugas</span>

        <div>
          <h1 className="max-w-[16ch] text-3xl font-semibold leading-tight tracking-tight text-balance xl:text-4xl">
            Sistem koreksi otomatis tugas video praktikum
          </h1>

          <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
            Kirim link video YouTube, dan biarkan sistem mencocokkan
            transkripnya dengan materi praktikum secara otomatis.
          </p>

          <ol className="mt-10 max-w-sm">
            {langkah.map((step, index) => (
              <li
                key={step}
                className="flex gap-4 border-t py-3 first:border-t-0"
              >
                <span className="tnum w-4 shrink-0 text-sm font-medium text-muted-foreground">
                  {index + 1}
                </span>

                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs text-muted-foreground">
          Teknologi Rekayasa Otomasi
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <span className="font-medium">Koreksi Tugas</span>
          </div>
          <h2 className="mb-1 text-2xl font-semibold tracking-tight">Masuk</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Gunakan akun Gmail kampus atau pribadimu untuk melanjutkan.
          </p>

          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            <GoogleIcon className="size-4" />
            Masuk dengan Google
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dengan masuk, kamu menyetujui bahwa data submission tugasmu akan
            diproses oleh sistem koreksi otomatis.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.96 11.96 0 000 12c0 1.93.46 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}
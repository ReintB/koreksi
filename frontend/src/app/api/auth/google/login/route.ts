import { NextResponse, type NextRequest } from "next/server";

import { signIn } from "@/auth";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/";

  // Hanya path internal yang diterima. Tanpa penjagaan ini `next` bisa diisi
  // URL domain lain dan endpoint login berubah jadi open redirect.
  const redirectTo =
    next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const url: string = await signIn("google", { redirectTo, redirect: false });

  return NextResponse.redirect(url);
}

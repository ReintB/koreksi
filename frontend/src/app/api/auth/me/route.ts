import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { peran } from "@/lib/otorisasi";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user?.id ?? email,
      email,
      name: session.user?.name ?? email,
      avatarUrl: session.user?.image ?? null,
      role: peran(email),
      active: true,
      // Tanpa database, jejak login tidak tersimpan di mana pun. Tiga nilai
      // berikut hanya melengkapi bentuk AuthUser sampai tabel app_user
      // mengambil alih.
      loginCount: 0,
      lastLogin: null,
      createdAt: null,
      // Roster NIM ada di database, tetapi penautan akun ke NIM belum
      // dikerjakan, jadi relasi mahasiswa masih kosong.
      student: null,
    },
  });
}

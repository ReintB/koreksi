import { NextResponse } from "next/server";

import { auth } from "@/auth";

/** Email yang diperlakukan sebagai admin, dipisah koma bila lebih dari satu. */
function daftarAdmin() {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

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
      role: daftarAdmin().includes(email.toLowerCase()) ? "admin" : "user",
      active: true,
      // Tanpa database, jejak login tidak tersimpan di mana pun. Tiga nilai
      // berikut hanya melengkapi bentuk AuthUser sampai FastAPI mengambil alih.
      loginCount: 0,
      lastLogin: null,
      createdAt: null,
      // Roster NIM ada di PostgreSQL milik backend, jadi relasi mahasiswa
      // belum bisa diisi. Akibatnya halaman kirim tugas tetap terkunci.
      student: null,
    },
  });
}

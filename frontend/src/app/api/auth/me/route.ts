import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { adminBawaan, akun } from "@/lib/otorisasi";

/**
 * Status sesi beserta peran dan tautan roster.
 *
 * Identitas datang dari Google; peran, status aktif, jejak login, dan NIM
 * yang tertaut datang dari app_user. Baris app_user dibuat saat login lewat
 * event signIn, jadi pada permintaan pertama setelah masuk barisnya sudah ada.
 */
export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const baris = await akun(email);

  // Mahasiswa yang tertaut ditampilkan di halaman profil dan dipakai halaman
  // kirim tugas untuk mengisi NIM, jadi diambil sekalian di sini.
  const mahasiswa = baris?.nim
    ? (
        await db()`SELECT id, nim, nama, angkatan FROM mahasiswa
                    WHERE nim = ${baris.nim}`
      )[0]
    : null;

  return NextResponse.json({
    authenticated: true,
    user: {
      id: baris?.id ?? email,
      email,
      name: (baris?.name as string | undefined) ?? session.user?.name ?? email,
      avatarUrl: (baris?.avatar_url as string | null) ?? session.user?.image ?? null,
      // ADMIN_EMAIL selalu admin supaya selalu ada jalan masuk meski tabelnya
      // masih kosong atau perannya terlanjur diturunkan.
      role: adminBawaan(email) || baris?.role === "admin" ? "admin" : "user",
      active: baris ? baris.active !== false : true,
      loginCount: (baris?.login_count as number | undefined) ?? 0,
      lastLogin: baris?.last_login
        ? new Date(baris.last_login as string).toISOString()
        : null,
      createdAt: baris?.created_at
        ? new Date(baris.created_at as string).toISOString()
        : null,
      student: mahasiswa
        ? {
            id: mahasiswa.id,
            nim: mahasiswa.nim,
            nama: mahasiswa.nama,
            angkatan: mahasiswa.angkatan,
          }
        : null,
    },
  });
}

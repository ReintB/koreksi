/**
 * Autentikasi Google sementara, dijalankan di Next.js.
 *
 * Desain aslinya menaruh auth di backend FastAPI. Selama backend itu belum
 * tersedia, endpoint di `src/app/api/auth/` meniru kontrak yang sama persis
 * (URL dan bentuk JSON) memakai next-auth. Begitu FastAPI hadir, hapus
 * folder tersebut dan berkas ini — rewrite `/api/:path*` di next.config.ts
 * otomatis mengambil alih tanpa perlu menyentuh komponen mana pun.
 *
 * Kredensial dibaca dari environment: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET,
 * dan AUTH_SECRET.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  // Vercel dan localhost berada di belakang proxy yang menulis ulang Host,
  // sehingga callback URL perlu dibentuk dari header permintaan.
  trustHost: true,
  events: {
    /**
     * Mencatat akun yang masuk.
     *
     * Identitas dijamin Google, tetapi peran, status aktif, dan tautan ke NIM
     * roster hanya ada di database. Tanpa pencatatan ini halaman admin tidak
     * pernah tahu siapa saja yang pernah masuk, sehingga tidak ada yang bisa
     * ditautkan ke roster.
     */
    async signIn({ user }) {
      if (!user.email) return;

      const sql = db();

      await sql`
        INSERT INTO app_user (id, email, name, avatar_url, login_count, last_login)
        VALUES (${crypto.randomUUID()}, ${user.email}, ${user.name ?? user.email},
                ${user.image ?? null}, 1, now())
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          avatar_url = EXCLUDED.avatar_url,
          login_count = app_user.login_count + 1,
          last_login = now()
      `;
    },
  },
});

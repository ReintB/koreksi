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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  // Vercel dan localhost berada di belakang proxy yang menulis ulang Host,
  // sehingga callback URL perlu dibentuk dari header permintaan.
  trustHost: true,
});

/**
 * Membuat cookie sesi next-auth yang sah untuk pengujian lokal.
 *
 * Endpoint dijaga oleh sesi, sehingga curl biasa selalu dijawab 401 dan yang
 * teruji hanya penjagaannya, bukan query di baliknya. Skrip ini menerbitkan
 * cookie yang sama seperti hasil login, supaya jalur datanya benar-benar
 * bisa diperiksa tanpa membuka browser.
 *
 * Hanya berguna bagi yang sudah memegang AUTH_SECRET, jadi tidak menambah
 * permukaan serang apa pun.
 *
 *   npx tsx --env-file=.env.local db/token.mts email@contoh.id "Nama"
 */
import { encode } from "@auth/core/jwt";

const email = process.argv[2];
const nama = process.argv[3] ?? "Penguji";
const secret = process.env.AUTH_SECRET;

if (!email) {
  console.error("Sertakan email sebagai argumen pertama.");
  process.exit(1);
}

if (!secret) {
  console.error("AUTH_SECRET belum diisi di .env.local.");
  process.exit(1);
}

// Nama cookie sekaligus salt enkripsi. Varian __Secure- dipakai saat HTTPS,
// tetapi pengujian lokal berjalan di http sehingga memakai nama polos.
const salt = "authjs.session-token";

const token = await encode({
  token: { sub: email, email, name: nama },
  secret,
  salt,
  maxAge: 3600,
});

console.log(`${salt}=${token}`);

/**
 * Mengosongkan seluruh isi database tanpa menyentuh skema.
 *
 * Dipakai saat data contoh sudah tidak diperlukan dan datanya akan diisi
 * sendiri. Tabel, kolom, constraint, dan indeks tetap utuh - yang hilang
 * hanya barisnya.
 *
 * Jalankan dari folder frontend:
 *   npx tsx --env-file=.env.local db/reset.mts --ya
 *
 * Flag --ya wajib. Tanpa itu skrip hanya melaporkan apa yang akan hilang
 * lalu berhenti, supaya perintah ini tidak pernah mengosongkan data
 * sungguhan hanya karena salah tekan panah atas di terminal.
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL belum diisi. Lihat frontend/.env.example.");
  process.exit(1);
}

const sql = neon(url);

// Urutan tidak penting karena memakai CASCADE, tetapi daftarnya ditulis
// lengkap supaya jelas tabel mana saja yang tersentuh.
const tabel = [
  "evaluasi",
  "submission",
  "mahasiswa_kelas",
  "app_user",
  "mahasiswa",
  "tugas",
  "mata_kuliah",
  "kelas_praktikum",
  "angkatan",
];

async function hitung(nama: string) {
  const baris = await sql.query(`SELECT count(*)::int AS jumlah FROM ${nama}`);
  return baris[0].jumlah as number;
}

console.log("Isi database saat ini:");

let total = 0;

for (const nama of tabel) {
  const jumlah = await hitung(nama);
  total += jumlah;
  console.log(`  ${String(jumlah).padStart(4)}  ${nama}`);
}

if (!process.argv.includes("--ya")) {
  console.log(`\n${total} baris akan hilang. Skema tetap utuh.`);
  console.log("Jalankan ulang dengan --ya untuk benar-benar mengosongkan.");
  process.exit(0);
}

await sql.query(`TRUNCATE TABLE ${tabel.join(", ")} RESTART IDENTITY CASCADE`);

console.log("\nSetelah dikosongkan:");

for (const nama of tabel) {
  console.log(`  ${String(await hitung(nama)).padStart(4)}  ${nama}`);
}

console.log("\nSkema tidak disentuh. Isi ulang dengan db/seed.mts bila perlu.");

/** Menampilkan id dan nama master data, untuk memeriksa keterbacaan id. */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

console.log("mata_kuliah:");
for (const b of await sql`SELECT id, nama FROM mata_kuliah ORDER BY nama`) {
  console.log(`  ${String(b.id).padEnd(34)} ${b.nama}`);
}

console.log("tugas:");
for (const b of await sql`SELECT id, mata_kuliah_id, nomor, judul FROM tugas ORDER BY mata_kuliah_id, nomor`) {
  console.log(`  ${String(b.id).padEnd(34)} T${b.nomor} ${b.judul}`);
}

console.log("kelas_praktikum:");
for (const b of await sql`SELECT id, nama FROM kelas_praktikum ORDER BY nama`) {
  console.log(`  ${String(b.id).padEnd(34)} ${b.nama}`);
}

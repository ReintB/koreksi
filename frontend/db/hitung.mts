/** Menghitung isi tiap tabel. Dipakai untuk memastikan tidak ada yang hilang. */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

for (const tabel of [
  "mata_kuliah", "tugas", "kelas_praktikum", "angkatan",
  "mahasiswa", "mahasiswa_kelas", "app_user", "submission", "evaluasi",
]) {
  const baris = await sql.query(`SELECT count(*)::int AS jumlah FROM ${tabel}`);
  console.log(`  ${String(baris[0].jumlah).padStart(4)}  ${tabel}`);
}

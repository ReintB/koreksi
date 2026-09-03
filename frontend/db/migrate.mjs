/**
 * Menjalankan db/schema.sql ke database Neon.
 *
 * Editor SQL bawaan Vercel memakai prepared statement, dan Postgres hanya
 * menerima satu perintah per prepared statement — menempel seluruh skema
 * sekaligus di sana ditolak dengan "cannot insert multiple commands into a
 * prepared statement". Skrip ini memecah berkas skema lalu menjalankannya
 * berurutan.
 *
 * Jalankan dari folder frontend:
 *   node --env-file=.env.local db/migrate.mjs
 *
 * Aman diulang: seluruh pernyataan di schema.sql memakai IF NOT EXISTS.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

/**
 * Memecah berkas SQL menjadi pernyataan terpisah.
 *
 * Komentar dibuang lebih dahulu. Tanpa itu, titik koma yang kebetulan muncul
 * di dalam komentar ikut dianggap pemisah dan pernyataan terpotong di tengah.
 * Setelah komentar hilang, skema ini tidak menyisakan titik koma selain
 * sebagai penutup pernyataan, sehingga pemecahannya tidak butuh parser SQL.
 */
export function pecahPernyataan(isi) {
  return isi
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((bagian) => bagian.trim())
    .filter((bagian) => bagian.length > 0);
}

function ringkas(teks) {
  return teks.trim().split(/\s+/).slice(0, 5).join(" ");
}

async function jalankan() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("DATABASE_URL belum diisi. Lihat frontend/.env.example.");
    process.exit(1);
  }

  const isi = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  const pernyataan = pecahPernyataan(isi);
  const sql = neon(url);

  for (const [index, teks] of pernyataan.entries()) {
    const nomor = `[${index + 1}/${pernyataan.length}]`;

    try {
      await sql.query(teks);
      console.log(`  ok  ${nomor} ${ringkas(teks)}`);
    } catch (error) {
      console.error(`GAGAL ${nomor} ${ringkas(teks)}`);
      console.error(error.message);
      process.exit(1);
    }
  }

  const tabel = await sql.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY 1`
  );

  console.log(`\n${pernyataan.length} pernyataan dijalankan.`);
  console.log(`${tabel.length} tabel di schema public:`);
  console.log(tabel.map((baris) => `  - ${baris.table_name}`).join("\n"));
}

// Hanya dijalankan bila dipanggil langsung, supaya pecahPernyataan bisa
// diimpor oleh pengujian tanpa ikut menyentuh database.
if (import.meta.filename === process.argv[1]) {
  await jalankan();
}

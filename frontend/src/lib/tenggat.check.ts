/**
 * Pemeriksa logika tenggat. Jalankan: `node src/lib/tenggat.check.ts`
 *
 * Tidak diimpor kode aplikasi, jadi `assert` tidak ikut ke bundel browser.
 * Yang diperiksa adalah bagian yang benar-benar bisa salah: pembulatan zona
 * waktu (tenggat 23.59 WIB harus tetap 23.59 WIB) dan batas tepat pada
 * detik tenggat — di situlah "terlambat" atau tidak diputuskan.
 */
import assert from "node:assert/strict";

import {
  isTerlambat,
  tenggatFromInput,
  tenggatInfo,
  tenggatToInput,
} from "./tenggat.ts";

// Nilai datetime-local disimpan sebagai waktu WIB, bukan waktu browser.
assert.equal(
  tenggatFromInput("2026-08-30T23:59"),
  "2026-08-30T23:59:00+07:00"
);

// Browser yang menyertakan detik tidak boleh menghasilkan ISO ganda.
assert.equal(
  tenggatFromInput("2026-08-30T23:59:30"),
  "2026-08-30T23:59:30+07:00"
);

// Kosong berarti "tanpa tenggat", bukan kesalahan.
assert.equal(tenggatFromInput(""), null);
assert.equal(tenggatFromInput("   "), null);
assert.equal(tenggatFromInput("bukan tanggal"), null);

// Bolak-balik form -> simpan -> form harus utuh.
const iso = tenggatFromInput("2026-09-01T07:30");
assert.equal(tenggatToInput(iso), "2026-09-01T07:30");
assert.equal(tenggatToInput(null), "");

const tenggat = "2026-08-30T23:59:00+07:00";

// Sehari sebelum tenggat: tepat waktu.
assert.equal(isTerlambat("2026-08-29T20:00:00+07:00", tenggat), false);

// Satu menit setelah tenggat: terlambat.
assert.equal(isTerlambat("2026-08-31T00:00:00+07:00", tenggat), true);

// Tepat pada detik tenggat masih dihitung tepat waktu.
assert.equal(isTerlambat(tenggat, tenggat), false);

// Zona waktu lain yang menunjuk saat sama tidak boleh berbeda hasilnya:
// 16.59 UTC = 23.59 WIB.
assert.equal(isTerlambat("2026-08-30T16:59:00Z", tenggat), false);
assert.equal(isTerlambat("2026-08-30T17:00:00Z", tenggat), true);

// Tugas tanpa tenggat tidak pernah terlambat.
assert.equal(isTerlambat("2026-12-31T23:59:00+07:00", null), false);

// Data rusak tidak boleh menuduh mahasiswa terlambat.
assert.equal(isTerlambat("entah kapan", tenggat), false);

const now = new Date("2026-08-26T10:00:00+07:00").getTime();

// Masih lama: informasi biasa.
const jauh = tenggatInfo("2026-08-30T23:59:00+07:00", now);
assert.equal(jauh.lewat, false);
assert.equal(jauh.tone, "neutral");
assert.equal(jauh.label, "4 hari lagi");

// Kurang dari 24 jam: mendesak.
const dekat = tenggatInfo("2026-08-26T20:00:00+07:00", now);
assert.equal(dekat.lewat, false);
assert.equal(dekat.tone, "warning");
assert.equal(dekat.label, "10 jam lagi");

// Sudah lewat: bahasanya harus jelas, bukan angka negatif.
const lewat = tenggatInfo("2026-08-24T23:59:00+07:00", now);
assert.equal(lewat.lewat, true);
assert.equal(lewat.tone, "danger");
assert.equal(lewat.label, "Lewat 1 hari");

// Sisa waktu dibulatkan ke bawah, tidak boleh terdengar lebih longgar.
assert.equal(
  tenggatInfo("2026-08-27T09:59:00+07:00", now).label,
  "23 jam lagi"
);

console.log("tenggat.check.ts: semua pemeriksaan lolos");

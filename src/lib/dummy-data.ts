/**
 * Data contoh selama backend belum tersambung. Semua yang ada di file ini
 * bersifat sementara — hapus file ini (dan importnya) begitu pengumpulan
 * benar-benar datang dari API.
 */

import type { Mahasiswa } from "@/lib/rekap";

import type {
  AdminSubmission,
  MahasiswaSubmission,
} from "@/lib/submission";

/**
 * Daftar peserta praktikum. Tanpa daftar ini "belum mengumpulkan" tidak bisa
 * dijawab — mahasiswa yang tidak mengirim apa pun tidak meninggalkan jejak di
 * data pengumpulan. Nanti datangnya dari data mahasiswa di backend.
 */
export const dummyMahasiswa: Mahasiswa[] = [
  { id: "mhs-01", nama: "Reint Bagas", nim: "21030123140001", kelasPraktikum: "A", angkatan: "2024" },
  { id: "mhs-02", nama: "Siti Aminah", nim: "21030123140002", kelasPraktikum: "B", angkatan: "2024" },
  { id: "mhs-03", nama: "Budi Santoso", nim: "21030123140003", kelasPraktikum: "A", angkatan: "2024" },
  { id: "mhs-04", nama: "Dewi Lestari", nim: "21030123140004", kelasPraktikum: "C", angkatan: "2024" },
  { id: "mhs-05", nama: "Andi Pratama", nim: "21030123140005", kelasPraktikum: "B", angkatan: "2024" },
  { id: "mhs-06", nama: "Nadia Rahmawati", nim: "21030123140006", kelasPraktikum: "A", angkatan: "2024" },
  { id: "mhs-07", nama: "Fajar Nugroho", nim: "21030123140007", kelasPraktikum: "A", angkatan: "2024" },
  { id: "mhs-08", nama: "Intan Permata", nim: "21030123140008", kelasPraktikum: "A", angkatan: "2024" },
  { id: "mhs-09", nama: "Rizky Maulana", nim: "21030123140009", kelasPraktikum: "A", angkatan: "2024" },
  { id: "mhs-10", nama: "Galih Saputra", nim: "21030123140010", kelasPraktikum: "B", angkatan: "2024" },
  { id: "mhs-11", nama: "Mira Anggraini", nim: "21030123140011", kelasPraktikum: "B", angkatan: "2024" },
  { id: "mhs-12", nama: "Yoga Prasetyo", nim: "21030123140012", kelasPraktikum: "B", angkatan: "2024" },
  { id: "mhs-13", nama: "Hana Kusuma", nim: "21030123140013", kelasPraktikum: "C", angkatan: "2024" },
  { id: "mhs-14", nama: "Bayu Wicaksono", nim: "21030123140014", kelasPraktikum: "C", angkatan: "2024" },
  { id: "mhs-15", nama: "Larasati Putri", nim: "21030123140015", kelasPraktikum: "C", angkatan: "2024" },
];

const contohTranskrip = `Pada video ini saya menjelaskan konsep variabel dan tipe data dalam bahasa C++.

Variabel merupakan tempat yang digunakan untuk menyimpan suatu data di dalam program.

Beberapa tipe data dasar yang digunakan antara lain int, float, dan char.

Tipe data int digunakan untuk bilangan bulat. Contohnya adalah int umur = 20.

Tipe data float digunakan untuk bilangan desimal. Contohnya adalah float nilai = 88.5.

Sedangkan tipe data char digunakan untuk menyimpan satu karakter, misalnya char grade = 'A'.

Variabel juga dapat langsung diberikan nilai pada saat pertama kali dibuat. Proses tersebut disebut sebagai inisialisasi.`;

const contohRubrik = `Mahasiswa menjelaskan konsep variabel dan tipe data dasar dalam bahasa C++.

Materi yang harus dibahas:

1. Pengertian variabel.
2. Deklarasi variabel.
3. Inisialisasi variabel.
4. Tipe data int.
5. Tipe data float.
6. Tipe data char.
7. Type casting.
8. Contoh penggunaan variabel dalam program sederhana.`;

const contohTranskripPercabangan = `Pada video ini saya menjelaskan mengenai percabangan pada bahasa C++.

Percabangan digunakan untuk menjalankan bagian program tertentu berdasarkan suatu kondisi.

Struktur paling sederhana adalah if.

Jika kondisi tidak terpenuhi, kita dapat menggunakan else.

Selain itu terdapat else if untuk memeriksa kondisi berikutnya.

Contohnya apabila nilai mahasiswa lebih besar atau sama dengan 80 maka program akan menampilkan grade A, jika tidak maka kondisi lain akan diperiksa.`;

const contohRubrikPercabangan = `Mahasiswa menjelaskan:

1. Pengertian percabangan.
2. Penggunaan if.
3. Penggunaan if-else.
4. Penggunaan else-if.
5. Operator perbandingan pada kondisi.
6. Nested condition.
7. Contoh implementasi percabangan pada program C++.`;

export const dummyAdminSubmissions: AdminSubmission[] = [
  {
    id: "1",
    namaMahasiswa: "Reint Bagas",
    nim: "21030123140001",
    kelasPraktikum: "A",
    mataKuliah: "Praktikum Alpro",
    tugasKe: 1,
    judulTugas: "Variabel dan Tipe Data",
    status: "selesai",
    skor: 88,
    dikirimPada: "2026-08-20T13:42:00+07:00",
    transkrip: contohTranskrip,
    rubrik: contohRubrik,
    evaluasi: [
      {
        id: "evaluasi-1",
        materi: "Pengertian variabel",
        status: "terpenuhi",
        catatan:
          "Konsep variabel dijelaskan dengan cukup jelas.",
      },
      {
        id: "evaluasi-2",
        materi: "Deklarasi dan inisialisasi variabel",
        status: "terpenuhi",
        catatan:
          "Mahasiswa memberikan contoh deklarasi sekaligus inisialisasi.",
      },
      {
        id: "evaluasi-3",
        materi: "Tipe data int",
        status: "terpenuhi",
      },
      {
        id: "evaluasi-4",
        materi: "Tipe data float",
        status: "terpenuhi",
      },
      {
        id: "evaluasi-5",
        materi: "Tipe data char",
        status: "sebagian",
        catatan:
          "Char disebutkan dan diberikan contoh, tetapi pembahasannya masih singkat.",
      },
      {
        id: "evaluasi-6",
        materi: "Type casting",
        status: "belum",
        catatan:
          "Tidak ditemukan pembahasan mengenai konversi antar tipe data.",
      },
    ],
  },
  {
    id: "2",
    namaMahasiswa: "Siti Aminah",
    nim: "21030123140002",
    kelasPraktikum: "B",
    mataKuliah: "Praktikum Alpro",
    tugasKe: 1,
    judulTugas: "Variabel dan Tipe Data",
    status: "diproses",
    skor: null,
    dikirimPada: "2026-08-22T18:10:00+07:00",
  },
  {
    id: "3",
    namaMahasiswa: "Budi Santoso",
    nim: "21030123140003",
    kelasPraktikum: "A",
    mataKuliah: "Praktikum Basis Data",
    tugasKe: 2,
    judulTugas: "Query SQL Dasar",
    status: "menunggu",
    skor: null,
    dikirimPada: "2026-08-23T08:52:00+07:00",
  },
  {
    id: "4",
    namaMahasiswa: "Dewi Lestari",
    nim: "21030123140004",
    kelasPraktikum: "C",
    mataKuliah: "Praktikum Alpro",
    tugasKe: 2,
    judulTugas: "Percabangan",
    status: "selesai",
    skor: 76,
    dikirimPada: "2026-08-21T15:36:00+07:00",
    transkrip: contohTranskripPercabangan,
    rubrik: contohRubrikPercabangan,
    evaluasi: [
      {
        id: "evaluasi-7",
        materi: "Pengertian percabangan",
        status: "terpenuhi",
      },
      {
        id: "evaluasi-8",
        materi: "Penggunaan if",
        status: "terpenuhi",
      },
      {
        id: "evaluasi-9",
        materi: "Penggunaan if-else",
        status: "terpenuhi",
      },
      {
        id: "evaluasi-10",
        materi: "Penggunaan else-if",
        status: "sebagian",
        catatan:
          "Else-if disebutkan, tetapi contoh implementasinya belum lengkap.",
      },
      {
        id: "evaluasi-11",
        materi: "Nested condition",
        status: "belum",
        catatan:
          "Tidak terdapat pembahasan mengenai kondisi bersarang.",
      },
    ],
  },
  {
    id: "5",
    namaMahasiswa: "Andi Pratama",
    nim: "21030123140005",
    kelasPraktikum: "B",
    mataKuliah: "Praktikum Alpro",
    tugasKe: 3,
    judulTugas: "Perulangan",
    status: "gagal",
    skor: null,
    dikirimPada: "2026-08-23T09:20:00+07:00",
    errorMessage:
      "Video tidak dapat diakses oleh sistem. Link mungkin private, telah dihapus, atau memiliki pembatasan akses.",
  },
];

const loremTranskrip = `Pada video ini saya menjelaskan konsep variabel dan tipe data dalam bahasa C++.

Variabel digunakan sebagai tempat untuk menyimpan suatu nilai yang dapat digunakan di dalam program.

Beberapa tipe data dasar yang sering digunakan adalah int untuk bilangan bulat, float untuk bilangan desimal, dan char untuk satu karakter.

Contohnya kita dapat menulis int umur = 20 untuk mendeklarasikan sekaligus menginisialisasi sebuah variabel.

Untuk nilai desimal kita dapat menggunakan float, misalnya float nilai = 88.5.

Sedangkan char dapat digunakan untuk satu karakter seperti char grade = 'A'.`;

const loremRubrik = `Mahasiswa menjelaskan konsep variabel dan tipe data dasar dalam bahasa C++.

Materi yang harus dibahas:
1. Pengertian variabel.
2. Deklarasi dan inisialisasi variabel.
3. Tipe data int.
4. Tipe data float.
5. Tipe data char.
6. Type casting dasar.
7. Contoh penggunaan variabel dalam program sederhana.`;

export const dummyRiwayatSubmissions: MahasiswaSubmission[] = [
  {
    id: "1",
    mataKuliah: "Praktikum Alpro",
    tugasKe: 1,
    judulTugas: "Variabel dan Tipe Data",
    linkYoutube: "https://youtube.com/watch?v=abc123",
    status: "selesai",
    skor: 88,
    dikirimPada: "2026-08-20T13:42:00+07:00",
    transkrip: loremTranskrip,
    rubrik: loremRubrik,
    evaluasi: [
      {
        id: "ev-1",
        materi: "Pengertian variabel",
        status: "terpenuhi",
      },
      {
        id: "ev-2",
        materi: "Deklarasi dan inisialisasi",
        status: "terpenuhi",
      },
      {
        id: "ev-3",
        materi: "Tipe data int dan float",
        status: "terpenuhi",
      },
      {
        id: "ev-4",
        materi: "Tipe data char",
        status: "terpenuhi",
      },
      {
        id: "ev-5",
        materi: "Type casting",
        status: "belum",
        catatan:
          "Tidak ditemukan pembahasan mengenai konversi antar tipe data.",
      },
    ],
  },

  {
    id: "2",
    mataKuliah: "Praktikum Alpro",
    tugasKe: 2,
    judulTugas: "Percabangan",
    linkYoutube: "https://youtube.com/watch?v=def456",
    status: "diproses",
    skor: null,
    dikirimPada: "2026-08-22T19:15:00+07:00",
  },

  {
    id: "3",
    mataKuliah: "Praktikum Basis Data",
    tugasKe: 1,
    judulTugas: "Pengenalan Database dan SQL",
    linkYoutube: "https://youtube.com/watch?v=ghi789",
    status: "menunggu",
    skor: null,
    dikirimPada: "2026-08-23T09:10:00+07:00",
  },

  {
    id: "4",
    mataKuliah: "Praktikum Jaringan Komputer",
    tugasKe: 1,
    judulTugas: "Dasar Jaringan Komputer",
    linkYoutube: "https://youtube.com/watch?v=error",
    status: "gagal",
    skor: null,
    dikirimPada: "2026-08-21T16:23:00+07:00",
    errorMessage:
      "Video YouTube tidak dapat diakses. Pastikan video tidak private atau dibatasi untuk akun tertentu.",
  },
];

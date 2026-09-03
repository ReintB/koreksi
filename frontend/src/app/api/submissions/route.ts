import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  nimTertaut,
  pastikanAdmin,
  pastikanAksesMahasiswa,
  pastikanMasuk,
  peran,
} from "@/lib/otorisasi";

const skemaKirim = z.object({
  nim: z.string().min(1),
  mataKuliahId: z.string().min(1),
  tugasId: z.string().min(1),
  linkYoutube: z
    .string()
    .url()
    .refine(
      (url) => url.includes("youtube.com") || url.includes("youtu.be"),
      "Link harus berasal dari YouTube"
    ),
  linkDrive: z
    .string()
    .url()
    .refine(
      (url) => url.includes("drive.google.com"),
      "Link harus berasal dari Google Drive"
    )
    .optional()
    .or(z.literal("")),
});

/**
 * Membaca pengumpulan beserta identitas pengirim, tugas, dan evaluasinya.
 */
async function bacaPengumpulan(nim?: string) {
  const sql = db();

  const baris = nim
    ? await sql`
        SELECT s.*, m.nama AS nama_mahasiswa, m.angkatan, m.kelas,
               mk.nama AS mata_kuliah,
               t.nomor AS tugas_ke, t.judul AS judul_tugas, t.tenggat, t.rubrik_text
          FROM submission s
          JOIN mahasiswa m ON m.nim = s.nim
          JOIN mata_kuliah mk ON mk.id = s.mata_kuliah_id
          JOIN tugas t ON t.id = s.tugas_id
         WHERE s.nim = ${nim}
         ORDER BY s.dikirim_pada DESC
      `
    : await sql`
        SELECT s.*, m.nama AS nama_mahasiswa, m.angkatan, m.kelas,
               mk.nama AS mata_kuliah,
               t.nomor AS tugas_ke, t.judul AS judul_tugas, t.tenggat, t.rubrik_text
          FROM submission s
          JOIN mahasiswa m ON m.nim = s.nim
          JOIN mata_kuliah mk ON mk.id = s.mata_kuliah_id
          JOIN tugas t ON t.id = s.tugas_id
         ORDER BY s.dikirim_pada DESC
      `;

  const idPengumpulan = baris.map((b) => b.id as string);

  const evaluasi = idPengumpulan.length
    ? await sql`
        SELECT id, submission_id, materi, status, catatan
          FROM evaluasi
         WHERE submission_id = ANY(${idPengumpulan})
         ORDER BY urutan
      `
    : [];

  const perPengumpulan = new Map<string, unknown[]>();

  for (const e of evaluasi) {
    const kunci = e.submission_id as string;
    const daftar = perPengumpulan.get(kunci) ?? [];

    daftar.push({
      id: e.id,
      materi: e.materi,
      status: e.status,
      catatan: e.catatan ?? undefined,
    });

    perPengumpulan.set(kunci, daftar);
  }

  return baris.map((b) => {
    const dikirimPada = new Date(b.dikirim_pada as string).toISOString();
    const tenggat = b.tenggat ? new Date(b.tenggat as string) : null;

    return {
      id: b.id,
      namaMahasiswa: b.nama_mahasiswa,
      nim: b.nim,
      // Kelas yang belum ditetapkan ditandai "-", sama seperti yang dipakai
      // rekap, supaya penyaringan kelas tidak perlu menangani null.
      kelasPraktikum: b.kelas ?? "-",
      angkatan: b.angkatan,
      mataKuliah: b.mata_kuliah,
      tugasKe: b.tugas_ke,
      judulTugas: b.judul_tugas,
      linkYoutube: b.link_youtube,
      status: b.status,
      // Yang ditampilkan adalah nilai manual bila ada, jatuh ke nilai mesin
      // bila tidak. Keduanya tetap dikirim supaya dialog ubah skor bisa
      // menunjukkan hasil otomatis di samping nilai penggantinya.
      skor: (b.skor_manual ?? b.skor_otomatis) as number | null,
      skorOtomatis: b.skor_otomatis as number | null,
      ditimpa: b.skor_manual !== null,
      catatanTimpa: (b.catatan_timpa as string | null) ?? null,
      terlambat: tenggat ? new Date(dikirimPada) > tenggat : false,
      dikirimPada,
      transkrip: (b.transkrip as string | null) ?? undefined,
      rubrik: (b.rubrik_text as string | null) ?? undefined,
      evaluasi: perPengumpulan.get(b.id as string) ?? undefined,
      errorMessage: (b.error_message as string | null) ?? undefined,
      // Berkas hasil koreksi belum dibuat, jadi tombol unduh sengaja
      // dinyatakan tidak tersedia alih-alih menjanjikan berkas yang tak ada.
      docxAvailable: false,
      sourceMethod: null,
    };
  });
}

export async function GET(request: NextRequest) {
  const nim = request.nextUrl.searchParams.get("nim");

  // Tanpa nim berarti meminta seluruh pengumpulan: hanya admin. Dengan nim,
  // pemilik NIM itu sendiri juga boleh, dijaga helper yang sama seperti profil.
  const sesi = nim ? await pastikanAksesMahasiswa(nim) : await pastikanAdmin();
  if (!sesi.ok) return sesi.balasan;

  return NextResponse.json(await bacaPengumpulan(nim ?? undefined));
}

export async function POST(request: Request) {
  const sesi = await pastikanMasuk();
  if (!sesi.ok) return sesi.balasan;

  const isi = skemaKirim.safeParse(await request.json());

  if (!isi.success) {
    return NextResponse.json(
      {
        detail:
          isi.error.issues[0]?.message ?? "Data pengumpulan tidak sesuai.",
      },
      { status: 400 }
    );
  }

  const data = isi.data;

  // NIM datang dari payload, jadi tanpa pemeriksaan ini siapa pun yang sudah
  // masuk bisa mengirim tugas atas nama mahasiswa lain.
  if (peran(sesi.email) !== "admin") {
    const milik = await nimTertaut(sesi.email);

    if (milik !== data.nim) {
      return NextResponse.json(
        { detail: "Anda hanya boleh mengirim tugas atas nama sendiri." },
        { status: 403 }
      );
    }
  }

  const sql = db();

  const [mahasiswa, tugas] = await Promise.all([
    sql`SELECT nim FROM mahasiswa WHERE nim = ${data.nim}`,
    sql`SELECT id FROM tugas
         WHERE id = ${data.tugasId} AND mata_kuliah_id = ${data.mataKuliahId}`,
  ]);

  if (mahasiswa.length === 0) {
    return NextResponse.json(
      { detail: "NIM tidak terdaftar pada roster." },
      { status: 404 }
    );
  }

  // Tugas harus benar-benar milik mata kuliah yang dipilih. Tanpa ini pasangan
  // yang tidak nyambung bisa tersimpan dan muncul sebagai baris rancu di rekap.
  if (tugas.length === 0) {
    return NextResponse.json(
      { detail: "Tugas tersebut bukan milik mata kuliah yang dipilih." },
      { status: 400 }
    );
  }

  // Mengirim ulang menggantikan pengumpulan sebelumnya untuk tugas yang sama,
  // bukan menambah baris kedua. Nilai lama dan hasil evaluasinya dibuang
  // karena mengacu pada video yang sudah tidak dikirim lagi.
  const disimpan = await sql`
    INSERT INTO submission
      (id, nim, mata_kuliah_id, tugas_id, link_youtube, link_drive, status)
    VALUES
      (${crypto.randomUUID()}, ${data.nim}, ${data.mataKuliahId}, ${data.tugasId},
       ${data.linkYoutube}, ${data.linkDrive || null}, ${"menunggu"})
    ON CONFLICT (nim, tugas_id) DO UPDATE SET
      link_youtube = EXCLUDED.link_youtube,
      link_drive = EXCLUDED.link_drive,
      status = 'menunggu',
      skor_otomatis = NULL,
      skor_manual = NULL,
      catatan_timpa = NULL,
      transkrip = NULL,
      error_message = NULL,
      dikirim_pada = now()
    RETURNING id
  `;

  const idTersimpan = disimpan[0].id as string;

  await sql`DELETE FROM evaluasi WHERE submission_id = ${idTersimpan}`;

  return NextResponse.json({ id: idTersimpan }, { status: 201 });
}

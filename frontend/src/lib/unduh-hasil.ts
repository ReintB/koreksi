/**
 * Placeholder unduhan berkas hasil koreksi.
 *
 * Tiga halaman (pengumpulan admin, rekap kelas, riwayat mahasiswa) sebelumnya
 * menyalin teks toast yang sama persis. Dikumpulkan di sini supaya begitu
 * penyimpanan berkas tersambung, hanya berkas ini yang perlu diganti.
 */
import { toast } from "sonner";

import type { SubmissionDetailData } from "@/lib/submission";

export function unduhHasil(submission: SubmissionDetailData) {
  console.log("Download hasil koreksi:", submission.id);

  toast.info(
    "File hasil koreksi akan tersedia setelah backend penyimpanan file dihubungkan."
  );
}

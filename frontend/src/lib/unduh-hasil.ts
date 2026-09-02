import { toast } from "sonner";
import type { SubmissionDetailData } from "@/lib/submission";

export function unduhHasil(submission: SubmissionDetailData) {
  if (submission.status !== "selesai") {
    toast.error("Hasil koreksi belum tersedia.");
    return;
  }

  const url = `/api/submissions/${encodeURIComponent(submission.id)}/docx`;
  window.open(url, "_blank", "noopener,noreferrer");
}

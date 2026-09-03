"use client";

import { useApiData } from "@/hooks/use-api-data";
import type { AdminSubmission, MahasiswaSubmission } from "@/lib/submission";

export type Mahasiswa = {
  id: string;
  nama: string;
  nim: string;
  kelasPraktikum: string;
  angkatan: string;
  email?: string | null;
};

export type AdminApiSubmission = AdminSubmission & {
  skorOtomatis: number | null;
  ditimpa: boolean;
  catatanTimpa?: string | null;
  terlambat: boolean;
  angkatan?: string;
  docxAvailable?: boolean;
  sourceMethod?: string | null;
};

export function useAdminSubmissions() {
  return useApiData<AdminApiSubmission[]>("/submissions", [], 4000);
}

export function useStudentSubmissions(nim: string | null) {
  const path = nim
    ? `/submissions?nim=${encodeURIComponent(nim)}`
    : "/submissions?nim=__none__";
  return useApiData<MahasiswaSubmission[]>(path, [], 4000);
}

export function useStudents() {
  return useApiData<Mahasiswa[]>("/students", [], 10000);
}

export type StudentProfile = {
  id: string;
  nama: string;
  nim: string;
  angkatan: string;
  email?: string | null;
  /** Satu kelas praktikum untuk seluruh mata kuliah; null bila belum ditetapkan. */
  kelas: string | null;
};

export function useStudentProfile(nim: string | null) {
  const path = nim
    ? `/students/${encodeURIComponent(nim)}`
    : "/students/__none__";
  return useApiData<StudentProfile | null>(path, null, 15000);
}

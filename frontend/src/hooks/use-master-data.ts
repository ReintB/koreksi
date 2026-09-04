"use client";

import { useEffect, useState, type SetStateAction } from "react";

import { toast } from "sonner";

import { api } from "@/lib/api";
import {
  initialMasterData,
  type MasterData,
} from "@/lib/master-data";

let currentData: MasterData = initialMasterData;
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<(data: MasterData) => void>();

function emit() {
  for (const listener of listeners) listener(currentData);
}

async function ensureLoaded() {
  if (loaded) return;
  if (!loading) {
    loading = api<MasterData>("/master-data")
      .then((data) => {
        currentData = data;
        loaded = true;
        emit();
      })
      .finally(() => {
        loading = null;
      });
  }
  await loading;
}
/**
 * @param pesanSukses ditampilkan hanya setelah server menerima perubahannya.
 *
 * Sebelumnya pemanggil memunculkan toast "berhasil" seketika, sementara PUT-nya
 * baru berangkat sesudah itu. Ketika server menolak — misalnya karena tugas
 * yang hendak dihapus masih punya pengumpulan — pengguna sudah terlanjur
 * diberi tahu berhasil, lalu melihat barisnya kembali muncul disertai toast
 * kedua yang membantah toast pertama.
 */
export function setMasterData(
  value: SetStateAction<MasterData>,
  pesanSukses?: string
) {
  // Keadaan sebelum perubahan disimpan supaya bisa dikembalikan bila server
  // menolak. Tanpa itu layar menampilkan data yang tidak pernah tersimpan,
  // lengkap dengan toast "berhasil", dan baru ketahuan saat halaman dimuat
  // ulang dan datanya lenyap.
  const sebelum = currentData;

  currentData =
    typeof value === "function"
      ? (value as (data: MasterData) => MasterData)(currentData)
      : value;
  emit();

  void api<MasterData>("/master-data", {
    method: "PUT",
    body: JSON.stringify(currentData),
  }).then((serverData) => {
    currentData = serverData;
    loaded = true;
    emit();

    if (pesanSukses) toast.success(pesanSukses);
  }).catch((error: unknown) => {
    currentData = sebelum;
    emit();

    toast.error("Perubahan tidak tersimpan.", {
      description:
        error instanceof Error
          ? error.message
          : "Server tidak merespons, perubahan dikembalikan.",
    });
  });
}

export function useMasterData() {
  const [data, setData] = useState(currentData);
  const [isHydrated, setHydrated] = useState(loaded);

  useEffect(() => {
    listeners.add(setData);
    void ensureLoaded()
      .catch((error) => console.error("Gagal memuat master data", error))
      .finally(() => setHydrated(true));
    return () => {
      listeners.delete(setData);
    };
  }, []);

  return { data, setMasterData, isHydrated };
}

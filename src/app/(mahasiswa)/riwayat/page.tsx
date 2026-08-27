"use client";

import { useState } from "react";
import { ChevronRight, Inbox } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/navbar";
import { PageHeader } from "@/components/page-header";
import { StatusSummary } from "@/components/status-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { EmptyState } from "@/components/common/empty-state";
import {
  ScoreValue,
  SubmissionStatusBadge,
} from "@/components/submission-status-badge";
import { SubmissionDetailDialog } from "@/components/submission-detail-dialog";

import { dummyRiwayatSubmissions } from "@/lib/dummy-data";

import {
  canOpenSubmission,
  formatSubmissionDate,
  type MahasiswaSubmission,
  type SubmissionDetailData,
} from "@/lib/submission";

import { cn } from "@/lib/utils";

export default function RiwayatPage() {
  const [selected, setSelected] = useState<MahasiswaSubmission | null>(null);

  function handleDownload(submission?: SubmissionDetailData) {
    if (submission) {
      console.log("Download hasil koreksi:", submission.id);
    }

    toast.info(
      "File hasil koreksi akan tersedia setelah backend penyimpanan file dihubungkan."
    );
  }

  const empty = dummyRiwayatSubmissions.length === 0;

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <PageHeader
          title="Riwayat Pengumpulan"
          description="Pantau status proses dan lihat hasil koreksi tugas yang telah dikirim."
        />

        <StatusSummary items={dummyRiwayatSubmissions} />

        {empty ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Inbox}
                title="Belum ada tugas yang dikirim"
                description="Setelah mengirim tugas, status koreksi akan muncul di halaman ini."
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <ul className="flex flex-col gap-3 md:hidden">
              {dummyRiwayatSubmissions.map((submission) => {
                const clickable = canOpenSubmission(submission.status);

                return (
                  <li key={submission.id}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">
                              Tugas {submission.tugasKe}
                            </p>

                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {submission.judulTugas}
                            </p>
                          </div>

                          <ScoreValue skor={submission.skor} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                          <SubmissionStatusBadge status={submission.status} />

                          <span className="tnum text-xs text-muted-foreground">
                            {submission.mataKuliah}
                            {" · "}
                            {formatSubmissionDate(submission.dikirimPada)}
                          </span>
                        </div>

                        {clickable && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full"
                            onClick={() => setSelected(submission)}
                          >
                            Lihat detail koreksi
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>

            <Card className="hidden md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Tugas</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Dikirim</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Skor</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {dummyRiwayatSubmissions.map((submission) => {
                      const clickable = canOpenSubmission(submission.status);

                      return (
                        <TableRow
                          key={submission.id}
                          className={cn(
                            "transition-colors",
                            clickable && "cursor-pointer hover:bg-muted/50"
                          )}
                          onClick={() => {
                            if (clickable) setSelected(submission);
                          }}
                        >
                          <TableCell className="min-w-55">
                            <p className="font-medium">
                              Tugas {submission.tugasKe}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {submission.judulTugas}
                            </p>
                          </TableCell>

                          <TableCell className="min-w-[190px] text-muted-foreground">
                            {submission.mataKuliah}
                          </TableCell>

                          <TableCell className="tnum whitespace-nowrap text-muted-foreground">
                            {formatSubmissionDate(submission.dikirimPada)}
                          </TableCell>

                          <TableCell>
                            <SubmissionStatusBadge status={submission.status} />
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-right">
                            <ScoreValue skor={submission.skor} />
                          </TableCell>

                          <TableCell className="text-right">
                            {clickable && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={
                                  "Lihat detail koreksi Tugas " +
                                  submission.tugasKe +
                                  " " +
                                  submission.judulTugas
                                }
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelected(submission);
                                }}
                              >
                                <ChevronRight className="size-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <p className="mt-3 hidden text-xs text-muted-foreground md:block">
              Klik pengumpulan dengan status selesai atau gagal untuk melihat
              detail.
            </p>
          </>
        )}
      </main>

      <SubmissionDetailDialog
        submission={selected}
        onClose={() => setSelected(null)}
        onDownload={handleDownload}
      />
    </>
  );
}

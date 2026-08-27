# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two roles, both signing in with Google (via next-auth):

- **Mahasiswa (students):** submit a YouTube video link (plus an optional Google Drive link for supporting files) as their answer to a praktikum assignment, then track the status and score of their own submissions.
- **Asisten praktikum & dosen (lab assistants and lecturers):** the shared admin/grading side. They configure mata kuliah (courses), tugas (assignments) and their rubrics, kelas praktikum (lab sections), and angkatan (student cohort/year); they monitor all incoming submissions and review the automatic grading result per submission (transcript vs. rubric, topic-by-topic).

## Product Purpose

"Koreksi Tugas" automates grading of practicum video submissions for Teknologi Rekayasa Otomasi (TRO) courses. A student explains an assignment's material on video instead of writing a report; the system is meant to transcribe the video and compare the transcript against the assignment's rubric to produce a per-topic evaluation and a score out of 100, replacing manual review of each video by an asisten praktikum. Success means asisten praktikum/dosen can grade a full class's video submissions from one dashboard, with the system doing the first-pass content matching instead of a human watching every video.

## Positioning

Where a normal LMS assignment submission just stores a link or file for a human to review, this system is meant to read the video's content (via transcript) and judge it against a structured rubric automatically, surfacing a topic-by-topic "terpenuhi / sebagian / belum" (met / partial / not met) breakdown rather than only a raw score.

## Operating Context

- Real academic workflow for TRO praktikum classes (Alpro, Basis Data, Jaringan Komputer, etc.), organized by mata kuliah → tugas (numbered, each with a rubric) → kelas praktikum → angkatan.
- Students submit via a YouTube link as the primary artifact; a Google Drive link is optional/supplementary.
- Asisten praktikum currently author rubrics as plain-text (`.txt`) files, max 2MB, uploaded per tugas.
- Submissions move through a status pipeline: menunggu (queued) → diproses (processing) → selesai (done) or gagal (failed, e.g. an inaccessible/private video link).

## Capabilities and Constraints

- Confirmed/built in the UI: student submission form with course/assignment cascading selects and link validation; student submission history; admin table of all submissions with filters (mata kuliah, kelas, status) and a detail view showing transcript, rubric, and per-topic evaluation; admin CRUD for mata kuliah, tugas (+ rubric .txt upload), kelas praktikum, and angkatan, persisted to localStorage for now.
- Not yet built (explicitly stubbed/TODO in code): Google sign-in (`next-auth` is installed but `signIn("google")` is not wired up), the actual submission backend/API (form currently only logs and toasts), video transcription, and the LLM-based rubric-matching/scoring engine. All submission and grading data currently shown in the admin UI is mock data.
- Grading mechanism (confirmed direction, not yet implemented): transcribe the submitted YouTube video, then use an LLM to semantically compare the transcript against the assignment's rubric text to produce the per-topic status and overall score.
- Rubrics are plain text only (no rich formatting), one per tugas.

## Brand Commitments

- Product name: "Koreksi Tugas".
- Indonesian-language UI throughout (`lang="id"`); copy, labels, and terminology (mahasiswa, tugas, rubrik, kelas praktikum, angkatan) should stay in Indonesian.

## Evidence on Hand

- No real submission, transcript, or scoring data yet — all examples in the admin UI (students, scores, transcripts, rubric text) are placeholder/dummy data and must not be treated as real evidence or carried into new work as fact.
- Existing rubric examples (e.g. "Variabel dan Tipe Data", "Pengenalan Database dan SQL") are realistic samples of the rubric format, not final content.

## Product Principles

- Automation should reduce, not replace, human oversight: asisten praktikum/dosen must be able to see the transcript, the rubric, and the system's per-topic reasoning, not just a final score.
- Keep the grading pipeline transparent and auditable per submission (status history, failure reasons like an inaccessible video) rather than a black box.
- Admin-configured master data (mata kuliah, tugas, rubrik, kelas, angkatan) is the single source of truth students select from — students never freeform this data.
- Indonesian academic terminology throughout; don't anglicize existing labels.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established yet.

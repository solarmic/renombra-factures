# Feature: Invoice renamer — phase 1

Locator: `odd/tasks/invoice-renamer-phase-1.md` · Engram mirror: `odd/invoice-renamer-phase-1/tasks`

## Objective

Free public static web app (GitHub Pages) where a user drops purchase invoices,
the app detects each invoice date **in the browser**, numbers them in ascending
date order with a user-configurable format, and exports a ZIP of renamed files.

## Problem / why

Freelancers renumber purchase invoices by hand for tax filings. The author
(miguelcirc) did 63 by hand on 2026-10-08 with the format `1/26V/NN <original name>`.

## Scope (authorized)

- Client-side only: no file ever leaves the device (no backend, no analytics on files).
- PDF: extract text with pdf.js, detect invoice date (content first, filename as fallback).
- Images (jpg, png, heic, webp...): no OCR. Warn that PDF works better and advise
  putting the invoice date in the filename; detect date from filename if present;
  otherwise the user types it in the review table.
- Review table: detected date + source (content/filename/manual), editable; files
  without a date block export until fixed (or are excluded explicitly).
- Configurable numbering template with tokens (sequence, padded sequence, year),
  free literal text, start number, keep/drop original name.
- Filename sanitization: `/ \ : * ? " < > |` replaced (cross-platform safe).
- Export ZIP (JSZip). Same-date ties ordered alphabetically by original name.
- Privacy notice ("your files never leave your device"), author credit "miguelcirc",
  donation link (Ko-fi placeholder URL to be provided by the author).
- UI languages: es (default), ca, en; picked from browser language, switchable.
- GitHub Pages deploy workflow.

Out of scope (phase 2+): OCR, invoice data extraction (NIF, base, IVA, total), accounts, server.

## Constraints

- Stack: Vite + Svelte 5 + TypeScript, Vitest, pdfjs-dist, JSZip. Plain modern CSS.
- Hexagonal-ish layout: `src/domain` (pure, fully unit-tested), `src/adapters`
  (pdf.js, zip, file-type), `src/ui` (Svelte components).
- Strict TDD: RED → GREEN → REFACTOR for domain logic. Runner: `npx vitest run`.
- Code, comments, identifiers in English. UI copy via i18n dictionaries.

## TDD

Mode: strict (on) · Source: global session config ("Strict TDD Mode: enabled") · Runner: `npx vitest run`

## Tasks

- [x] T1 Scaffold Vite + Svelte 5 + TS + Vitest; `npm run build`, `npm test` green. Route: delegated (writer, 2+ files).
- [x] T2 Domain: date extraction from text and filename, numbering template, sanitization, ordering. Route: delegated.
- [x] T3 Adapters: PDF text extraction, file classification, ZIP export. Route: delegated.
- [x] T4 UI: dropzone, review table, settings, image warnings, privacy notice, credit, donation, i18n, modern look. Route: delegated.
- [ ] T5 GitHub Pages workflow + README. Route: delegated.

## Acceptance criteria

- Dropping the author's real 2026 PDFs yields correct dates for text PDFs.
- Images trigger the PDF/filename advice; dates in image filenames are used.
- Template tokens: `{n}` sequence, `{n:K}` zero-padded to K digits, `{yy}`/`{yyyy}` invoice year,
  `{mm}`/`{dd}` invoice month/day, `{name}` original name without extension. Template
  `1/{yy}V/{n:2} {name}` reproduces `1/26V/07 Gener 05012026 Orange` (sanitized for the OS).
- ZIP downloads with renamed files; no network request carries file content.
- `npm test` and `npm run build` pass.

## Delivery

Strategy: ask-on-risk. Forecast: > 400 authored lines (will ask chain strategy before PR).
Push / PR / Pages enablement are the author's decisions.

## Progress

- 2026-10-08: repo initialized (`2428b7a`), branch `feat/phase-1-renamer`.
- T1 done: Vite 8 + Svelte 5 + TS 5 + Vitest 5 scaffold. Checks: `npx vitest run` 1 passed (toolchain smoke), `npm run build` ok, `npm run check` 0 errors. Commit: see git log (`chore: scaffold ...`).
- T2 done (route: inline writer, single bounded writer agent). RED/GREEN evidence: `extractDateFromFilename.test.ts` RED = suite failed to load (module missing), GREEN = 12/12; `sanitizeFilename`/`renderTemplate`/`planRenames` tests RED = 3 files failed to load (12 existing passed), GREEN = 32/32 total; `extractDateFromText.test.ts` RED = suite failed to load, GREEN = 18/19 then 19/19 after fixing a wrong test expectation (05/13/2026 is a valid mm/dd), later +4 synthetic tests from the real-data harness (label-cell-above, spaced separators, issue-vs-operation date, document-vs-order date) = 55/55. Acceptance test `1/{yy}V/{n:2} {name}` start 7 -> `1-26V-07 Gener 05012026 Orange.pdf` present in `planRenames.test.ts`. Commits: `2d4055a` (filename/template/sanitize/plan), text extractor commit follows in git log.
- Real-data harness (not committed, no invoices copied): 68 PDFs (1:26V:01..69 minus the .xlsx), 37 correct, 16 mismatches, 15 null (all image-only PDFs with empty text -> filename fallback). All 16 mismatches judged expectation errors: 11 BSM (name uses operation date, invoice prints issue date +1 day), #16 (name = due date), #38 (name = order date), #46 (printed issue date 2026-09-26 vs name 2606), #62 (printed issue 03/09 vs name 1009), #68 (printed invoice 30/09 vs name 2909 = due/paid date).
- T3 done. Adapters: `fileKind` (pdf|image|unsupported), `zipExport` (JSZip -> Blob), `pdfTextLayout` (positioned runs -> lines with column spacing), `pdfTextCore` (pdf.js injected, first 2 pages) and `pdfText` (lazy pdf.js + worker via `?url`, no CDN). Tests: fileKind 16 cases, zip 2, layout 5, core 1 (generated minimal PDF through pdfjs-dist legacy build in node). Evidence note: adapter tests were written together with the adapter code (not strict RED-first; adapters are not domain logic); the extractor fix for shifted columns (nearest label cell) was found via the real-data pdf.js run and then covered by a synthetic test. Cross-check: pdf.js text path and `pdftotext -layout` path give identical extractor results on all 68 real PDFs (37 correct / 16 expectation mismatches / 15 image-only null). Checks: `npx vitest run` 9 files / 80 tests passed, `npm run check` 0 errors, `npm run build` ok.
- T4 done. UI: Dropzone, Settings (token chips, live preview), ReviewTable (source badges, editable date, include toggle, responsive stacked rows <720px), Notices (privacy, image advice, ignored files), ExportBar (disabled until all included files have dates, with missing count), Footer (credit + `DONATION_URL` from `src/config.ts`, TODO to confirm), LanguageSwitch, runes store `state.svelte.ts`, i18n es/ca/en (browser language detection), `app.css` (light/dark, AA tokens, reduced-motion). Tests: i18n 5, AppState 5 (ignored files, filename dates for images, export blocking/unblocking, fallback-year recompute, preview). Checks: `npx vitest run` 11 files / 90 tests, `npm run check` 0 errors, `npm run build` ok. Real-browser smoke (headless Chrome via puppeteer-core in scratchpad, not committed): uploading a synthetic PDF + an image -> PDF date read from content through the bundled worker, image dated from filename, export enabled, only same-origin requests. Found and fixed: file input reset now happens after files are read.

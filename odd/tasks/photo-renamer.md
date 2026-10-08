# Feature: Photo renamer (separate site)

Locator: `odd/tasks/photo-renamer.md` · Engram mirror: `odd/photo-renamer/tasks`
Branch: `feat/photo-renamer` (cut from `feat/game-ui` at `176306a`).

## Objective

Second site (own page) from the same repo: the user drops photos, the app orders them by capture
time, renames them with a user-defined template (order number, one or two free title
fields, date, place) and exports a ZIP, optionally grouped into folders by place.
Everything stays in the browser.

## Problem / why

People without Photoshop/Lightroom have no easy way to batch-rename trip or family
photos like `01_Menorca_Familia.jpg`. The invoice tool already has the template engine,
ZIP export and privacy model to reuse.

## Scope (authorized)

- Two independent sites from one repo (replaces the earlier "tab" idea): the invoices app stays at the
  root page, the photo renamer is a second Vite entry (`fotos/index.html`). Each has its own title,
  description, hero title, palette and bundle (photos must not load pdf.js, invoices must not load exifr
  or the places dataset). They link to each other from the footer/header; URLs come from `src/config.ts`
  (base-aware relative defaults, overridable with `VITE_FACTURES_URL` / `VITE_FOTOS_URL`).
  Rationale: separate audiences and identity, shared code without duplication, a future custom domain with
  subdomains (factures.<domain> / fotos.<domain>), and the photos site may later move to Cloudflare Pages.
  Photos hero: "Ordena y renombra tus fotos" (ca "Ordena i reanomena les teves fotos", en "Sort and rename
  your photos"), warm sunset palette (amber -> coral -> rose), AA contrast in light and dark.
- Photo input: jpg, jpeg, png, heic/heif, webp, tiff, gif. Files are never modified or
  re-encoded; only renamed (bytes copied as-is into the ZIP).
- Ordering key per photo, in this priority: EXIF DateTimeOriginal (with sub-seconds /
  offset when present) → camera/phone file counter in the name (IMG_0423, DSC01234,
  PXL_20260705_..., etc.) → File.lastModified. Show the source as a badge
  (EXIF / name / file date). Ties: original name, locale-aware.
- Template tokens: `{n}`, `{n:K}`, `{t1}`, `{t2}` (two free title fields set once for
  the batch), `{yyyy}`, `{yy}`, `{mm}`, `{dd}`, `{hh}`, `{min}`, `{place}`, `{name}`.
  Default template `{n:2}_{t1}_{t2}` (→ `01_Menorca_Familia.jpg`). Empty tokens must not
  leave doubled or dangling separators (`01__Familia` → `01_Familia`).
- Place: EXIF GPS → nearest populated place from an OFFLINE bundled GeoNames
  dataset (cities1000, CC BY 4.0), loaded lazily only when `{place}` is used or folder
  grouping is on. No coordinate ever leaves the device. Photos without GPS: empty place
  (or "No location" folder).
- Optional "group into folders by place" in the ZIP; optional per-row exclude and
  manual title override is NOT required for v1.
- Attribution "Place data: GeoNames (CC BY 4.0)" in the footer/README when the dataset ships.

Out of scope: editing EXIF, image previews beyond small thumbnails (thumbnails optional),
online geocoding, video files.

## Constraints

- Reuse domain pieces (template rendering, sanitization, splitExtension, zip export)
  instead of duplicating; extend them where needed with tests.
- `src/domain` pure and fully unit-tested; EXIF via a small, maintained, MIT library
  (e.g. `exifr`) behind an adapter; reverse geocoding = pure domain function over a
  compact dataset (nearest neighbour with a grid/bucket index, haversine distance).
- Zero external requests at runtime (dataset and fonts bundled/served from the site).
- Code, comments, identifiers in English; UI copy via i18n es/ca/en.
- Safari matters (see bugfix memory: test in WebKit with Safari-like gaps).

## TDD

Mode: strict (on) · Source: global session config · Runner: `npx vitest run`

## Tasks

- [x] P1 Two-site structure: Vite multi-page (root = invoices, `fotos/` = photos), per-site title/hero/palette, cross-links, bundle separation (invoices untouched behaviourally). Route: delegated writer.
- [x] P2 Domain: photo ordering key (EXIF date → filename counter → lastModified), template tokens incl. `{t1}`/`{t2}`/`{place}`/time, separator cleanup, rename plan with optional place folders. Route: delegated writer.
- [x] P3 Adapters: EXIF reader (date, GPS) incl. HEIC; places dataset build script + compact asset; nearest-place lookup. Route: delegated writer.
- [x] P4 Photo UI: dropzone, settings (template, t1, t2, start, folders toggle), review table with order source + place, ZIP export with folders. Route: delegated writer.
- [x] P5 Docs (README, credits/attribution), WebKit + Chrome smoke with real-looking samples. Route: delegated writer.

## Acceptance criteria

- Photos with EXIF are ordered by capture time even when mixing phone and camera files.
- Photos without EXIF fall back to the camera counter, then file date, with a visible badge.
- `{n:2}_{t1}_{t2}` with t1="Menorca", t2="Familia" → `01_Menorca_Familia.jpg`; empty t2 → `01_Menorca.jpg`.
- A photo with GPS near Ciutadella de Menorca gets place "Ciutadella" (offline), and the
  ZIP groups it under `Ciutadella/` when grouping is on.
- No network request carries file content or coordinates; the dataset is only fetched
  from the site itself and only when needed.
- `npm test`, `npm run check`, `npm run build` pass; invoices site still works in Safari-like WebKit.

## Delivery

Strategy: ask-on-risk. Forecast: well over 400 authored lines (dataset asset excluded).
Merge/publish is the author's decision.

## Progress

- 2026-10-08: branch created, feature document written.
- 2026-10-08 (coordinator order change): P2 and P3 first; P1 (tabs) and P4 (UI) on hold until the author decides tab vs separate page.
- P2 done. RED: 5 new test files failed on missing modules (105 passed / 5 failed files) -> GREEN: `npx vitest run` 21 files, 144 tests. Route: delegated writer.
  - New domain: `renderTokens` (shared engine, separator cleanup around empty tokens), `uniqueName`, `photoTime` (EXIF parse, wall-clock moments), `photoNameKey` (PXL_/date names, WhatsApp, camera counters), `photoSortKey` (+ `comparePhotoKeys`), `planPhotos` (global numbering, optional place folders). `renderTemplate`/`planRenames` now use the shared pieces; ZIP entries accept `folder`.
  - Mixed-source ordering rule: tier 0 exact moment (EXIF, or datetime in name) by time; tier 1 counter-only by counter; tier 2 file date only. Wall-clock time, EXIF offset ignored.
- P3 done. RED: `places.test.ts` (7 tests) and `exifReader.test.ts` failed on missing modules, then the compact-format tests failed 4/10 before `encodePlaces`/`parsePlaces` were rewritten -> GREEN `npx vitest run` 24 files, 162 tests. `placesLoader.test.ts` was written together with its implementation (no separate RED observed). Route: delegated writer.
  - exifr 7.1.3 lite bundle (JPEG+HEIC verified with synthetic fixtures made with exiftool/sips); `pick` option is broken in lite so the adapter parses with section flags and reads `latitude`/`longitude`. TIFF/PNG EXIF is not read (full bundle only); such files fall back to name/file date.
  - Dataset: GeoNames cities1000 downloaded 2026-10-08, 171,171 places, `public/places/places.txt` 2,871,532 bytes raw / 1,297,490 gzip (hundredths-of-degree, delta-coded). `scripts/build-places.mjs` regenerates it.
  - `nearestPlace` verified on the real dataset: Ciutadella -> "Ciutadella", Maó -> "Maó".
- 2026-10-08 (author decision): photos is a separate website, not a tab. P1 redefined as two-site structure; P4 builds the photo UI on the photos page.
- P1 done (two-site structure): Vite multi-page, `appType: 'mpa'`, `fotos/index.html` entry, per-site title/description/hero/palette (`src/fotos/palette.css`), cross-links via `FACTURES_URL`/`FOTOS_URL` in `src/config.ts` (overridable with `VITE_*`). Shared `LangState`, `Footer`, `Dropzone`, `LanguageSwitch`, `SiteLink`. Chunk graph: `pdf-*`/`pdfWorker-*` referenced only by the invoices entry, `lite.esm-*` (exifr) only by the photos entry, shared chunk has neither; `places.txt` is requested only at runtime from the photos page.
- P4 done: photos UI (dropzone, settings, review table with source badge/place/new name, notices, ZIP with folders). Tests: `photoState.test.ts` (11), `i18n.test.ts`, `photoKind.test.ts`. RED observed on missing `photoState.svelte` module; `photoKind` implementation was added right after its test (no separate RED).
- P5 done: README, attribution in the photos footer, real-browser smoke in Chrome and WebKit (also with NO_ITER=1), screenshots in the e2e scratchpad.

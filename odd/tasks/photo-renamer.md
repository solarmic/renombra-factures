# Feature: Photo renamer tab

Locator: `odd/tasks/photo-renamer.md` · Engram mirror: `odd/photo-renamer/tasks`
Branch: `feat/photo-renamer` (cut from `feat/game-ui` at `176306a`).

## Objective

Second tab in the same app: the user drops photos, the app orders them by capture
time, renames them with a user-defined template (order number, one or two free title
fields, date, place) and exports a ZIP, optionally grouped into folders by place.
Everything stays in the browser.

## Problem / why

People without Photoshop/Lightroom have no easy way to batch-rename trip or family
photos like `01_Menorca_Familia.jpg`. The invoice tool already has the template engine,
ZIP export and privacy model to reuse.

## Scope (authorized)

- Tabs: "Facturas" | "Fotos" (i18n es/ca/en), keyboard-accessible tablist, last tab
  remembered in localStorage (try/catch). Each tab has its own hero title and palette,
  same modern game aesthetic (Chakra Petch, gradient title, HUD panels):
  - Invoices: current title and cyan → violet → magenta palette.
  - Photos: title "Ordena y renombra tus fotos" (ca "Ordena i reanomena les teves fotos",
    en "Sort and rename your photos"), a distinct palette (e.g. warm sunset: amber →
    coral → rose, or lime → teal), AA contrast in light and dark.
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

- [ ] P1 Tabs + per-tab hero title and palette (invoices untouched behaviourally). Route: delegated writer.
- [ ] P2 Domain: photo ordering key (EXIF date → filename counter → lastModified), template tokens incl. `{t1}`/`{t2}`/`{place}`/time, separator cleanup, rename plan with optional place folders. Route: delegated writer.
- [ ] P3 Adapters: EXIF reader (date, GPS) incl. HEIC; places dataset build script + compact asset; nearest-place lookup. Route: delegated writer.
- [ ] P4 Photo UI: dropzone, settings (template, t1, t2, start, folders toggle), review table with order source + place, ZIP export with folders. Route: delegated writer.
- [ ] P5 Docs (README, credits/attribution), WebKit + Chrome smoke with real-looking samples. Route: delegated writer.

## Acceptance criteria

- Photos with EXIF are ordered by capture time even when mixing phone and camera files.
- Photos without EXIF fall back to the camera counter, then file date, with a visible badge.
- `{n:2}_{t1}_{t2}` with t1="Menorca", t2="Familia" → `01_Menorca_Familia.jpg`; empty t2 → `01_Menorca.jpg`.
- A photo with GPS near Ciutadella de Menorca gets place "Ciutadella" (offline), and the
  ZIP groups it under `Ciutadella/` when grouping is on.
- No network request carries file content or coordinates; the dataset is only fetched
  from the site itself and only when needed.
- `npm test`, `npm run check`, `npm run build` pass; invoices tab still works in Safari-like WebKit.

## Delivery

Strategy: ask-on-risk. Forecast: well over 400 authored lines (dataset asset excluded).
Merge/publish is the author's decision.

## Progress

- 2026-10-08: branch created, feature document written.

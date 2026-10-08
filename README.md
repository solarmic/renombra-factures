# Renombra Factures

Two free, static web apps from one repository:

- **Renombra Factures** (site root): renames and numbers purchase invoices by date.
  Drop your PDFs (or images), review the detected dates, choose a naming format
  and download a ZIP with the renamed files.
- **Renombra Fotos** (`fotos/`): sorts photos by capture time (EXIF, then a datetime or
  counter in the file name, then the file date), renames them with a template
  (`{n:2}_{t1}_{t2}` by default, plus date, time and place tokens) and downloads a ZIP,
  optionally grouped in folders by place. Files are copied byte for byte.

They are independent Vite pages that share code (`src/domain`, `src/adapters`, `src/ui`) and
link to each other. Each page only loads its own code: the invoices page never loads exifr or the
places dataset, and the photos page never loads pdf.js.

The UI is available in Spanish (default), Catalan and English, chosen from your
browser language and switchable at any time.

## Privacy

Everything runs in your browser. Files are read locally, dates are detected locally
and the ZIP is built locally. Nothing is uploaded or stored, there is no backend and
no analytics, and closing the tab erases everything. The built site makes no network
request other than loading its own files.

## How it works

1. PDFs: text is extracted with [pdf.js](https://mozilla.github.io/pdf.js/) (first two
   pages) and the invoice date is scored by context. Dates next to invoice-date labels
   ("Fecha factura", "Data d'emissió", "Invoice date"...) win over delivery-note, due,
   order, payment and period dates. If the PDF has no text (a scan), the date in the
   file name is used.
2. Images (jpg, png, heic, webp...): no OCR. Put the date in the file name
   (`Factura 0501.jpg`, `2026-01-05 Factura.jpg`) or type it in the review table.
3. Files are sorted by date (ties by original name), numbered from the starting number
   and renamed with your template. Original extensions are preserved.
4. Export is enabled once every included file has a date.

## Template tokens

| Token      | Meaning                                         |
| ---------- | ----------------------------------------------- |
| `{n}`      | Sequence number                                 |
| `{n:K}`    | Sequence number zero-padded to `K` digits       |
| `{yy}`     | Invoice year, 2 digits                          |
| `{yyyy}`   | Invoice year, 4 digits                          |
| `{mm}`     | Invoice month, 2 digits                         |
| `{dd}`     | Invoice day, 2 digits                           |
| `{name}`   | Original file name without extension            |

Unknown tokens are kept as literal text. Characters not allowed in file names
(`/ \ : * ? " < > |` and control characters) are replaced with the configured
replacement (default `-`).

Default template `1/{yy}V/{n:2} {name}` with start `7` turns
`Gener 05012026 Orange.pdf` (dated 2026-01-05) into `1-26V-07 Gener 05012026 Orange.pdf`.

## Place data (photos)

Photo place names come from an offline dataset, `public/places/places.txt`, built once from
[GeoNames](https://www.geonames.org/) `cities1000` (CC BY 4.0, downloaded 2026-10-08, 171,171 places;
2.9 MB raw, about 1.3 MB gzipped). Nothing is looked up online: the file is served by this same site and
fetched only when a template uses `{place}` or place folders are on, then the nearest place within 30 km
of the photo's GPS position is found in the browser. To refresh it run `node scripts/build-places.mjs`
(Node 22.18 or newer; the only network access of the project, at build time).

Capture time and GPS are read from EXIF with [exifr](https://github.com/MikeKovarik/exifr) (MIT, lite
bundle: JPEG and HEIC), loaded on the first photo. Files without readable EXIF fall back to a
datetime or counter in the file name, then to the file date.

## Two sites, one build

`npm run build` emits `dist/index.html` (invoices) and `dist/fotos/index.html` (photos). With
`BASE_PATH=/<repo>/` (as the GitHub Pages workflow does) the photos site is served at
`/<repo>/fotos/`, and both pages and the places dataset use that base.

The cross-links default to those relative locations. For separate domains, set them at build time:

```sh
VITE_FACTURES_URL=https://factures.example.org/ VITE_FOTOS_URL=https://fotos.example.org/ npm run build
```

To deploy the photos site on its own later (for example on Cloudflare Pages), publish the contents of
`dist/fotos/` together with `dist/assets/` and `dist/places/` (or build with `BASE_PATH=/` and serve
`fotos/index.html` as the site root); nothing in the code assumes the two share a host. No Cloudflare
configuration is included yet.

## Local development

```sh
npm install
npm run dev      # dev server: invoices at /, photos at /fotos/
npm test         # unit tests (Vitest)
npm run check    # type-check Svelte and TypeScript
npm run build    # production build in dist/
```

Stack: Vite, Svelte 5, TypeScript (strict), Vitest, pdfjs-dist, exifr, JSZip.

Layout:

- `src/domain` pure logic (date extraction, template, sanitization, planning), fully unit-tested
- `src/adapters` pdf.js, file classification and ZIP export
- `src/ui` invoices Svelte components, state and i18n dictionaries, plus shared pieces (language switch, footer, dropzone)
- `src/fotos` photos page: entry, components, state, palette and i18n
- `scripts/build-places.mjs` regenerates `public/places/places.txt`
- `src/config.ts` app name, author and the donation URL

## Deploy to GitHub Pages

1. Push the repository to GitHub (the workflow deploys from `main`).
2. In the repository go to Settings, Pages, and set Source to **GitHub Actions**.
3. Push to `main` (or run the workflow manually). The workflow runs the tests, builds
   with `BASE_PATH=/<repository-name>/` and publishes `dist/`.

For a custom domain or a user site served from `/`, build without `BASE_PATH`.

## Configuration

Edit `src/config.ts` to change the app name, author or donation link
(`DONATION_URL` is a placeholder to be confirmed).

## Credits

Headings, buttons and badges use [Chakra Petch](https://fonts.google.com/specimen/Chakra+Petch) (SIL Open Font License 1.1), bundled locally through `@fontsource/chakra-petch`; no font is loaded from an external server.

Place data: [GeoNames](https://www.geonames.org/) (CC BY 4.0). EXIF reading: [exifr](https://github.com/MikeKovarik/exifr) (MIT).

## License

Copyright (c) miguelcirc. License to be defined by the author.

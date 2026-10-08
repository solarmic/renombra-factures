// One-time build step: downloads GeoNames cities1000 and writes the compact offline dataset used by the app.
//   node scripts/build-places.mjs [--min-population=0]
// Requires Node >= 22.18 (runs the TypeScript encoder directly). The output is committed, so normal builds
// never touch the network. Data: GeoNames, CC BY 4.0, https://www.geonames.org/
import { mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import JSZip from 'jszip';
import { encodePlaces } from '../src/domain/places.ts';

const SOURCE = 'https://download.geonames.org/export/dump/cities1000.zip';
const OUT_DIR = new URL('../public/places/', import.meta.url);
const minPopulation = Number(process.argv.find((a) => a.startsWith('--min-population='))?.split('=')[1] ?? 0);

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
const zip = await JSZip.loadAsync(await response.arrayBuffer());
const text = await zip.file('cities1000.txt').async('string');

// GeoNames columns: 1 name, 4 latitude, 5 longitude, 14 population.
const places = [];
for (const line of text.split('\n')) {
  const c = line.split('\t');
  if (c.length < 15) continue;
  const lat = Number(c[4]);
  const lon = Number(c[5]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Number(c[14]) < minPopulation) continue;
  places.push({ name: c[1], lat, lon });
}

const encoded = encodePlaces(places);
await mkdir(OUT_DIR, { recursive: true });
await writeFile(new URL('places.txt', OUT_DIR), encoded);
await writeFile(
  new URL('SOURCE.txt', OUT_DIR),
  `Place data: GeoNames (https://www.geonames.org/), licensed CC BY 4.0.\nSource: ${SOURCE}\nDownloaded: ${new Date().toISOString().slice(0, 10)}\nPlaces: ${places.length} (min population ${minPopulation})\n`,
);
console.log(`${places.length} places, ${Buffer.byteLength(encoded)} bytes raw, ${gzipSync(encoded, { level: 9 }).length} bytes gzip`);

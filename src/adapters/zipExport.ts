import JSZip from 'jszip';

export interface ZipEntry {
  name: string;
  /** Optional folder inside the archive (a single path segment). */
  folder?: string | null;
  data: Uint8Array | ArrayBuffer | Blob;
}

/** Builds the export archive entirely in memory; nothing is sent anywhere. */
export async function buildZip(entries: readonly ZipEntry[]): Promise<Blob> {
  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.folder ? `${entry.folder}/${entry.name}` : entry.name, entry.data, { binary: true });
  }
  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'STORE' });
}

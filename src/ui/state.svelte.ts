import { classifyFile, type FileKind } from '../adapters/fileKind';
import { extractPdfText } from '../adapters/pdfText';
import { buildZip } from '../adapters/zipExport';
import { DEFAULTS, ZIP_FILE_NAME } from '../config';
import { extractDateFromFilename } from '../domain/extractDateFromFilename';
import { extractDateFromText } from '../domain/extractDateFromText';
import { planRenames } from '../domain/planRenames';
import { renderTemplate } from '../domain/renderTemplate';
import { sanitizeFilename } from '../domain/sanitizeFilename';
import type { YMD } from '../domain/types';
import { detectLanguage, dictionaries, type Lang } from './i18n';

export type DateSource = 'content' | 'filename' | 'manual';

export interface Entry {
  id: number;
  file: File;
  kind: Exclude<FileKind, 'unsupported'>;
  status: 'reading' | 'done' | 'error';
  /** PDF had no extractable text (probably a scan). */
  noText: boolean;
  contentDate: YMD | null;
  manualDate: YMD | null;
  included: boolean;
}

export interface Row {
  entry: Entry;
  date: YMD | null;
  source: DateSource | null;
  newName: string | null;
}

let nextId = 1;

export class AppState {
  lang = $state<Lang>(
    detectLanguage(typeof navigator === 'undefined' ? undefined : (navigator.languages ?? navigator.language)),
  );
  template = $state<string>(DEFAULTS.template);
  start = $state<number>(DEFAULTS.start);
  replacement = $state<string>(DEFAULTS.replacement);
  fallbackYear = $state(new Date().getFullYear());
  entries = $state<Entry[]>([]);
  ignored = $state<string[]>([]);
  exporting = $state(false);

  t = $derived(dictionaries[this.lang]);
  hasImages = $derived(this.entries.some((e) => e.kind === 'image'));

  /** Effective date and where it came from: manual > content > filename. */
  resolve(entry: Entry): { date: YMD | null; source: DateSource | null } {
    if (entry.manualDate) return { date: entry.manualDate, source: 'manual' };
    if (entry.contentDate) return { date: entry.contentDate, source: 'content' };
    const fromName = extractDateFromFilename(entry.file.name, this.fallbackYear);
    return fromName ? { date: fromName.date, source: 'filename' } : { date: null, source: null };
  }

  plan = $derived.by(() =>
    planRenames(
      this.entries.map((entry) => ({
        entry,
        name: entry.file.name,
        date: this.resolve(entry).date,
        included: entry.included,
      })),
      { template: this.template, start: this.safeStart, replacement: this.replacement },
    ),
  );

  get safeStart(): number {
    return Number.isFinite(this.start) ? Math.max(0, Math.trunc(this.start)) : DEFAULTS.start;
  }

  /** Numbered rows first (in output order), then rows still missing a date, then excluded ones. */
  rows = $derived.by((): Row[] => {
    const byEntry = new Map(this.plan.planned.map((p) => [p.item.entry, p.newName]));
    const rows = this.entries.map((entry): Row => {
      const { date, source } = this.resolve(entry);
      return { entry, date, source, newName: byEntry.get(entry) ?? null };
    });
    const rank = (r: Row) => (r.newName ? 0 : r.entry.included ? 1 : 2);
    const order = new Map(this.plan.planned.map((p, i) => [p.item.entry, i]));
    return rows.sort(
      (a, b) =>
        rank(a) - rank(b) || (order.get(a.entry) ?? 0) - (order.get(b.entry) ?? 0) || a.entry.id - b.entry.id,
    );
  });

  missingDates = $derived(this.plan.missingDate);
  readyCount = $derived(this.plan.planned.length);
  reading = $derived(this.entries.some((e) => e.status === 'reading'));
  canExport = $derived(this.readyCount > 0 && this.missingDates === 0 && !this.reading && !this.exporting);

  preview = $derived.by(() => {
    const first = this.plan.planned[0];
    const date = first ? this.resolve(first.item.entry).date : null;
    const sample: YMD = date ?? { y: new Date().getFullYear(), m: 1, d: 5 };
    const name = first ? first.item.name : this.t.sampleName;
    const base = name.replace(/\.[A-Za-z0-9]{1,8}$/, '');
    const ext = /\.[A-Za-z0-9]{1,8}$/.exec(name)?.[0] ?? '';
    return sanitizeFilename(renderTemplate(this.template, { n: this.safeStart, date: sample, name: base }), this.replacement) + ext;
  });

  setLang(lang: Lang): void {
    this.lang = lang;
    document.documentElement.lang = lang;
  }

  async addFiles(files: Iterable<File>): Promise<void> {
    const added: Entry[] = [];
    const ignored: string[] = [];
    for (const file of files) {
      const kind = classifyFile(file);
      if (kind === 'unsupported') {
        ignored.push(file.name);
        continue;
      }
      added.push({
        id: nextId++,
        file,
        kind,
        status: kind === 'pdf' ? 'reading' : 'done',
        noText: false,
        contentDate: null,
        manualDate: null,
        included: true,
      });
    }
    this.ignored = [...this.ignored, ...ignored];
    this.entries.push(...added);

    for (const entry of this.entries.filter((e) => added.some((a) => a.id === e.id) && e.kind === 'pdf')) {
      await this.readPdf(entry);
    }
  }

  private async readPdf(entry: Entry): Promise<void> {
    try {
      const text = await extractPdfText(await entry.file.arrayBuffer());
      entry.noText = text.trim() === '';
      entry.contentDate = extractDateFromText(text)?.date ?? null;
      entry.status = 'done';
    } catch {
      entry.status = 'error';
    }
  }

  setManualDate(entry: Entry, date: YMD | null): void {
    entry.manualDate = date;
  }

  remove(entry: Entry): void {
    this.entries = this.entries.filter((e) => e.id !== entry.id);
  }

  clear(): void {
    this.entries = [];
    this.ignored = [];
  }

  dismissIgnored(): void {
    this.ignored = [];
  }

  async exportZip(): Promise<void> {
    if (!this.canExport) return;
    this.exporting = true;
    try {
      const blob = await buildZip(
        await Promise.all(
          this.plan.planned.map(async (p) => ({ name: p.newName, data: await p.item.entry.file.arrayBuffer() })),
        ),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = ZIP_FILE_NAME;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      this.exporting = false;
    }
  }
}

export const app = new AppState();

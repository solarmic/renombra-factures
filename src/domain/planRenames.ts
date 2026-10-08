import { splitExtension } from './fileName';
import { renderTemplate } from './renderTemplate';
import { sanitizeFilename } from './sanitizeFilename';
import { uniqueName } from './uniqueName';
import { compareYMD, type YMD } from './types';

export interface PlanItem {
  name: string;
  date: YMD | null;
  included: boolean;
}

export interface PlanOptions {
  template: string;
  start: number;
  replacement: string;
}

export interface PlannedRename<T extends PlanItem> {
  item: T;
  n: number;
  newName: string;
}

export interface SkippedItem<T extends PlanItem> {
  item: T;
  reason: 'no-date' | 'excluded';
}

export interface RenamePlan<T extends PlanItem> {
  planned: PlannedRename<T>[];
  skipped: SkippedItem<T>[];
  /** Included items that still lack a date (they block export). */
  missingDate: number;
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export function planRenames<T extends PlanItem>(items: readonly T[], options: PlanOptions): RenamePlan<T> {
  const skipped: SkippedItem<T>[] = [];
  const candidates: { item: T; date: YMD; index: number }[] = [];

  items.forEach((item, index) => {
    if (!item.included) skipped.push({ item, reason: 'excluded' });
    else if (!item.date) skipped.push({ item, reason: 'no-date' });
    else candidates.push({ item, date: item.date, index });
  });

  candidates.sort(
    (a, b) => compareYMD(a.date, b.date) || collator.compare(a.item.name, b.item.name) || a.index - b.index,
  );

  const used = new Set<string>();
  const planned = candidates.map(({ item, date }, position): PlannedRename<T> => {
    const n = options.start + position;
    const { base, ext } = splitExtension(item.name);
    const stem = sanitizeFilename(renderTemplate(options.template, { n, date, name: base }), options.replacement);

    const newName = uniqueName(used, stem, ext);
    return { item, n, newName };
  });

  return { planned, skipped, missingDate: skipped.filter((s) => s.reason === 'no-date').length };
}

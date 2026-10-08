export interface TextItem {
  str: string;
  width: number;
  height: number;
  /** PDF text matrix: [a, b, c, d, x, y]. */
  transform: number[];
}

const LINE_TOLERANCE = 3;

/** Rebuilds visual lines from positioned text runs, approximating columns with spaces. */
export function itemsToText(items: readonly TextItem[]): string {
  const placed = items
    .filter((i) => i.str.trim() !== '')
    .map((i) => ({ ...i, x: i.transform[4] ?? 0, y: i.transform[5] ?? 0 }))
    .sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: (typeof placed)[] = [];
  let lineY = Number.NaN;
  for (const it of placed) {
    if (lines.length === 0 || Math.abs(it.y - lineY) > LINE_TOLERANCE) {
      lines.push([]);
      lineY = it.y;
    }
    lines[lines.length - 1]!.push(it);
  }

  return lines
    .map((line) => {
      line.sort((a, b) => a.x - b.x);
      let out = '';
      let prevEnd = Number.NaN;
      for (const it of line) {
        if (out !== '') {
          const unit = Math.max(it.height, 1) * 0.5;
          const gap = it.x - prevEnd;
          const needsSpace = !/\s$/.test(out) && !/^\s/.test(it.str);
          if (gap > unit * 0.3 && needsSpace) {
            out += ' '.repeat(Math.min(40, Math.max(1, Math.round(gap / unit))));
          } else if (gap > unit * 1.5) {
            out += ' '.repeat(Math.min(40, Math.round(gap / unit)));
          }
        }
        out += it.str;
        prevEnd = it.x + it.width;
      }
      return out;
    })
    .join('\n');
}

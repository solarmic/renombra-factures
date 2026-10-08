export type DropMode = 'empty' | 'reading' | 'loaded';

/** What the dropzone should show: nothing loaded, files still being read, or a loaded list. */
export function dropModeOf(total: number, pending: number): DropMode {
  return total === 0 ? 'empty' : pending > 0 ? 'reading' : 'loaded';
}

/**
 * Memoizes an async loader, but forgets a failed attempt so the next call retries.
 * Without this, one failed chunk load (flaky network, stale deploy) would fail every later PDF.
 */
export function cachedLoader<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}

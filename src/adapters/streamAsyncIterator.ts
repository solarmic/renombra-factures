interface ReaderLike {
  read(): Promise<{ done: boolean; value?: unknown }>;
  releaseLock(): void;
  cancel(reason?: unknown): Promise<void>;
}

/**
 * Adds `for await` support to ReadableStream where the browser lacks it (Safari).
 * pdf.js iterates streams with `for await`, both on the page and inside its worker.
 */
export function installStreamAsyncIterator(proto: object): void {
  if (Symbol.asyncIterator in proto) return;
  Object.defineProperty(proto, Symbol.asyncIterator, {
    configurable: true,
    writable: true,
    value: async function* (this: { getReader(): ReaderLike }) {
      const reader = this.getReader();
      let finished = false;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            finished = true;
            return;
          }
          yield value;
        }
      } finally {
        // An early `break` must cancel the stream, as the native iterator does.
        if (!finished) await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    },
  });
}

if (typeof ReadableStream !== 'undefined') installStreamAsyncIterator(ReadableStream.prototype);

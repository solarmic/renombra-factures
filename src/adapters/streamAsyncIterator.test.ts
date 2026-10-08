import { describe, expect, it } from 'vitest';
import { installStreamAsyncIterator } from './streamAsyncIterator';

/** A ReadableStream look-alike without async iteration, like Safari's. */
function fakeStreamClass() {
  class FakeStream {
    released = false;
    cancelled = false;
    constructor(private readonly chunks: number[]) {}
    getReader() {
      const chunks = [...this.chunks];
      return {
        read: async () => (chunks.length ? { done: false, value: chunks.shift() } : { done: true, value: undefined }),
        releaseLock: () => {
          this.released = true;
        },
        cancel: async () => {
          this.cancelled = true;
        },
      };
    }
  }
  return FakeStream;
}

describe('installStreamAsyncIterator', () => {
  it('makes a stream without async iteration iterable with for await', async () => {
    const FakeStream = fakeStreamClass();
    installStreamAsyncIterator(FakeStream.prototype);
    const seen: number[] = [];
    const stream = new FakeStream([1, 2, 3]);
    for await (const chunk of stream as unknown as AsyncIterable<number>) seen.push(chunk);
    expect(seen).toEqual([1, 2, 3]);
    expect(stream.released).toBe(true);
  });

  it('releases the reader when the loop exits early', async () => {
    const FakeStream = fakeStreamClass();
    installStreamAsyncIterator(FakeStream.prototype);
    const stream = new FakeStream([1, 2, 3]);
    for await (const chunk of stream as unknown as AsyncIterable<number>) if (chunk === 1) break;
    expect(stream.released).toBe(true);
    expect(stream.cancelled).toBe(true);
  });

  it('does not cancel a stream that was read to the end', async () => {
    const FakeStream = fakeStreamClass();
    installStreamAsyncIterator(FakeStream.prototype);
    const stream = new FakeStream([1]);
    for await (const chunk of stream as unknown as AsyncIterable<number>) void chunk;
    expect(stream.cancelled).toBe(false);
  });

  it('leaves a native implementation untouched', () => {
    const native = async function* () {};
    const proto = { [Symbol.asyncIterator]: native };
    installStreamAsyncIterator(proto);
    expect(proto[Symbol.asyncIterator]).toBe(native);
  });
});

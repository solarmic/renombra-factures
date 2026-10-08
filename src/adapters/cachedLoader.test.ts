import { describe, expect, it, vi } from 'vitest';
import { cachedLoader } from './cachedLoader';

describe('cachedLoader', () => {
  it('loads once and reuses the value', async () => {
    const load = vi.fn().mockResolvedValue('lib');
    const get = cachedLoader(load);
    expect(await get()).toBe('lib');
    expect(await get()).toBe('lib');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('retries on the next call after a failed load instead of caching the failure', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('chunk failed')).mockResolvedValue('lib');
    const get = cachedLoader(load);
    await expect(get()).rejects.toThrow('chunk failed');
    expect(await get()).toBe('lib');
    expect(load).toHaveBeenCalledTimes(2);
  });
});

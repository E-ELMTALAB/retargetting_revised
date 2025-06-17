import { describe, it, expect } from 'vitest';
import { SessionStore } from '../../src/lib/session';
import { importKey } from '../../src/lib/encryption';

describe('SessionStore', () => {
  it('stores and retrieves encrypted sessions', async () => {
    const kv = new Map<string, string>();
    const kvNs = {
      get: async (k: string) => kv.get(k) || null,
      put: async (k: string, v: string) => { kv.set(k, v); }
    };
    const keyMaterial = '0123456789abcdef0123456789abcdef';
    const key = await importKey(new TextEncoder().encode(keyMaterial));
    const store = new SessionStore(kvNs, key);
    await store.set(1, 'mysession');
    const result = await store.get(1);
    expect(result).toBe('mysession');
  });
});

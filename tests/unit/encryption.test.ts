import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, importKey } from '../../src/lib/encryption';

describe('encryption', () => {
  it('encrypts and decrypts data', async () => {
    const keyMaterial = '0123456789abcdef0123456789abcdef';
    const key = await importKey(new TextEncoder().encode(keyMaterial));
    const text = 'hello';
    const enc = await encrypt(text, key);
    const dec = await decrypt(enc, key);
    expect(dec).toBe(text);
  });
});

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export class SessionStore {
  constructor(private kv: KVNamespace, private key: CryptoKey) {}

  async set(accountId: number, session: string) {
    const encrypted = await encrypt(session, this.key);
    await this.kv.put(`session:${accountId}`, encrypted);
  }

  async get(accountId: number): Promise<string | null> {
    const encrypted = await this.kv.get(`session:${accountId}`);
    if (!encrypted) return null;
    return decrypt(encrypted, this.key);
  }
}

import { encrypt, decrypt } from './encryption';

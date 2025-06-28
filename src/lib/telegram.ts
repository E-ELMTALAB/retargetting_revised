
import MTProto from '@mtproto/core/envs/node';

class MemoryStorage {
  private data = new Map<string, string>();

  async set(key: string, value: string) {
    this.data.set(key, value);
  }

  async get(key: string) {
    return this.data.get(key) ?? null;
  }

  dump() {
    return JSON.stringify(Object.fromEntries(this.data));
  }
}

export interface PendingLogin {
  client: any;
  phoneNumber: string;
  phoneCodeHash: string;
  storage: MemoryStorage;

}

export class TelegramService {
  private pending = new Map<string, PendingLogin>();

  constructor(private apiId: number, private apiHash: string) {}

  async sendCode(phone: string) {

    const storage = new MemoryStorage();
    const client = new MTProto({
      api_id: this.apiId,
      api_hash: this.apiHash,
      storageOptions: { instance: storage },
    });
    const result = await client.call('auth.sendCode', {
      phone_number: phone,
      settings: { _: 'codeSettings' },
    });
    this.pending.set(phone, {
      client,
      phoneNumber: phone,
      phoneCodeHash: result.phone_code_hash,
      storage,
    });

  }

  async signIn(phone: string, code: string): Promise<string> {
    const login = this.pending.get(phone);
    if (!login) throw new Error('no pending login');

    const { client, phoneCodeHash, storage } = login;
    await client.call('auth.signIn', {
      phone_number: phone,
      phone_code_hash: phoneCodeHash,
      phone_code: code,
    });
    this.pending.delete(phone);
    return storage.dump();

  }
}

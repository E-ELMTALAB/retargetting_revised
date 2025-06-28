import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

export interface PendingLogin {
  client: TelegramClient;
  phoneNumber: string;
  phoneCodeHash: string;
}

export class TelegramService {
  private pending = new Map<string, PendingLogin>();

  constructor(private apiId: number, private apiHash: string) {}

  async sendCode(phone: string) {
    const session = new StringSession('');
    const client = new TelegramClient(session, this.apiId, this.apiHash, {
      connectionRetries: 5,
    });
    await client.connect();
    const result = await client.sendCode({ apiId: this.apiId, apiHash: this.apiHash }, phone);
    this.pending.set(phone, { client, phoneNumber: phone, phoneCodeHash: result.phoneCodeHash });
  }

  async signIn(phone: string, code: string): Promise<string> {
    const login = this.pending.get(phone);
    if (!login) throw new Error('no pending login');
    const { client, phoneCodeHash } = login;
    const user = await client.invoke(
      new (await import('telegram/tl')).Api.auth.SignIn({
        phoneNumber: phone,
        phoneCodeHash,
        phoneCode: code,
      })
    );
    await client.disconnect();
    const session = client.session.save();
    this.pending.delete(phone);
    return session;
  }
}

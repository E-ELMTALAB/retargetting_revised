import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram';

export async function sendLoginCode(apiId: number, apiHash: string, phone: string) {
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 5 });
  await client.connect();
  const result = await client.sendCode({
    apiId,
    apiHash,
    phoneNumber: phone,
    settings: new Api.CodeSettings({})
  });
  await client.disconnect();
  return { phoneCodeHash: result.phoneCodeHash as string };
}

export async function verifyLoginCode(apiId: number, apiHash: string, phone: string, phoneCodeHash: string, code: string, password?: string) {
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 5 });
  await client.connect();
  try {
    await client.signIn({ phoneNumber: phone, phoneCodeHash, phoneCode: code });
  } catch (e: any) {
    if (e.errorMessage === 'SESSION_PASSWORD_NEEDED' && password) {
      await client.checkPassword(password);
    } else {
      await client.disconnect();
      throw e;
    }
  }
  const session = client.session.save();
  await client.disconnect();
  return session;
}

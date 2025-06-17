export async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(data)
  );
  const buffer = new Uint8Array(cipher);
  const result = new Uint8Array(iv.length + buffer.length);
  result.set(iv, 0);
  result.set(buffer, iv.length);
  return Buffer.from(result).toString('base64');
}

export async function decrypt(data: string, key: CryptoKey): Promise<string> {
  const buffer = Buffer.from(data, 'base64');
  const iv = buffer.slice(0, 12);
  const ciphertext = buffer.slice(12);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plain);
}

export async function importKey(secret: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', secret, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

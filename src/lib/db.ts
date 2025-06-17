export interface D1Config {
  endpoint: string;
  token: string;
}

export async function query<T>(config: D1Config, sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params })
  });
  if (!res.ok) {
    throw new Error(`D1 error: ${res.status}`);
  }
  const data = await res.json();
  return data.results as T[];
}

import { httpClient, type HttpClient } from '@/shared/api';

export async function signOut(client: HttpClient = httpClient): Promise<void> {
  await client.post('/bff/auth/logout', {});
}

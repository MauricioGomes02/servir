import { httpClient, type HttpClient } from '@/shared/api';

export type SessionSnapshot =
  | Readonly<{ authenticationEnabled: false; authenticated: false }>
  | Readonly<{ authenticationEnabled: true; authenticated: false }>
  | Readonly<{ authenticationEnabled: true; authenticated: true; userId: string }>;

export function getSession(
  signal?: AbortSignal,
  client: HttpClient = httpClient,
): Promise<SessionSnapshot> {
  return client.get<SessionSnapshot>('/bff/auth/session', signal);
}

export function googleLoginUrl(returnPath: string): string {
  const parameters = new URLSearchParams({ returnPath });
  return `/bff/auth/google/login?${parameters.toString()}`;
}

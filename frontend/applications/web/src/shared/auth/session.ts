import { currentLocale } from '@/shared/i18n';

export type SessionSnapshot =
  | Readonly<{ authenticationEnabled: false; authenticated: false }>
  | Readonly<{ authenticationEnabled: true; authenticated: false }>
  | Readonly<{ authenticationEnabled: true; authenticated: true; userId: string }>;

export async function getSession(signal?: AbortSignal): Promise<SessionSnapshot> {
  const response = await fetch('/bff/auth/session', {
    method: 'GET',
    headers: { Accept: 'application/json', 'Accept-Language': currentLocale() },
    signal,
  });
  if (!response.ok) throw new Error('auth.session.unavailable');
  return (await response.json()) as SessionSnapshot;
}

export function googleLoginUrl(returnPath: string): string {
  const parameters = new URLSearchParams({ returnPath });
  return `/bff/auth/google/login?${parameters.toString()}`;
}

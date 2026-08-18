import { HttpProblem, type ProblemDetails } from './problem-details';
import { currentLocale } from '@/shared/i18n';

export interface HttpClient {
  get<TResponse>(path: string, signal?: AbortSignal): Promise<TResponse>;
  post<TResponse, TBody>(path: string, body: TBody, signal?: AbortSignal): Promise<TResponse>;
}

export function createFetchHttpClient(): HttpClient {
  function csrfToken(): string | undefined {
    const cookie = document.cookie
      .split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith('__Host-servir-csrf='));
    return cookie === undefined
      ? undefined
      : decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1));
  }

  async function request<TResponse>(
    path: string,
    init: RequestInit,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    const response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Accept-Language': currentLocale(),
        ...(init.method === 'GET' || init.method === 'HEAD' || csrfToken() === undefined
          ? {}
          : { 'x-csrf-token': csrfToken() }),
        ...init.headers,
      },
      signal,
    });
    if (!response.ok) throw new HttpProblem((await response.json()) as ProblemDetails);
    return (await response.json()) as TResponse;
  }

  return {
    get: (path, signal) => request(path, { method: 'GET' }, signal),
    post: (path, body, signal) =>
      request(
        path,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        signal,
      ),
  };
}

export const httpClient = createFetchHttpClient();

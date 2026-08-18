import { HttpProblem, type ProblemDetails } from './problem-details';
import { currentLocale } from '@/shared/i18n';

export const HttpClientErrorCodes = {
  InvalidProblemResponse: 'web.http.problem_response.invalid',
  InvalidSuccessResponse: 'web.http.success_response.invalid',
  RequestFailed: 'web.http.request.failed',
} as const;

export type HttpClientErrorCode = (typeof HttpClientErrorCodes)[keyof typeof HttpClientErrorCodes];

export class HttpClientError extends Error {
  constructor(
    readonly code: HttpClientErrorCode,
    options?: ErrorOptions,
  ) {
    super(code, options);
    this.name = 'HttpClientError';
  }
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'status' in value &&
    typeof value.status === 'number'
  );
}

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
    let response: Response;
    try {
      response = await fetch(path, {
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
    } catch (error) {
      throw new HttpClientError(HttpClientErrorCodes.RequestFailed, { cause: error });
    }
    if (!response.ok) {
      let problem: unknown;
      try {
        problem = await response.json();
      } catch (error) {
        throw new HttpClientError(HttpClientErrorCodes.InvalidProblemResponse, { cause: error });
      }
      if (!isProblemDetails(problem)) {
        throw new HttpClientError(HttpClientErrorCodes.InvalidProblemResponse);
      }
      throw new HttpProblem(problem);
    }
    if (response.status === 204) return undefined as TResponse;
    try {
      return (await response.json()) as TResponse;
    } catch (error) {
      throw new HttpClientError(HttpClientErrorCodes.InvalidSuccessResponse, { cause: error });
    }
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

import { HttpProblem, type ProblemDetails } from './problem-details';

export interface HttpClient {
  get<TResponse>(path: string, signal?: AbortSignal): Promise<TResponse>;
  post<TResponse, TBody>(path: string, body: TBody, signal?: AbortSignal): Promise<TResponse>;
}

export function createFetchHttpClient(): HttpClient {
  async function request<TResponse>(
    path: string,
    init: RequestInit,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    const response = await fetch(path, {
      ...init,
      headers: { Accept: 'application/json', 'Accept-Language': 'pt-BR', ...init.headers },
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

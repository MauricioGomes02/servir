export interface ProblemDetailError {
  readonly code: string;
  readonly detail: string;
  readonly pointer?: string;
}

export interface ProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly correlationId?: string;
  readonly errors?: readonly ProblemDetailError[];
}

export class HttpProblem extends Error {
  public constructor(public readonly problem: ProblemDetails) {
    super(problem.title);
    this.name = 'HttpProblem';
  }
}

export function fieldErrors(problem: ProblemDetails, field: string): readonly string[] {
  return (problem.errors ?? [])
    .filter((error) => error.pointer === `#/${field}`)
    .map((error) => error.detail);
}

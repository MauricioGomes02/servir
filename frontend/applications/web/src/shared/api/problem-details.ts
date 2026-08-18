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
  readonly code: string;

  public constructor(public readonly problem: ProblemDetails) {
    const code = problem.errors?.[0]?.code ?? problem.type;
    super(code);
    this.name = 'HttpProblem';
    this.code = code;
  }
}

export function fieldErrors(problem: ProblemDetails, field: string): readonly string[] {
  return (problem.errors ?? [])
    .filter((error) => error.pointer === `#/${field}`)
    .map((error) => error.detail);
}

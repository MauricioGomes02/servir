import type { ExecutionContext } from '@/shared/application/context';

import { HttpExecutionContextUnavailableError } from './http-execution-context-unavailable-error';

export function requireHttpExecutionContext(
  context: ExecutionContext | null,
): ExecutionContext {
  if (context === null) {
    throw new HttpExecutionContextUnavailableError();
  }

  return context;
}

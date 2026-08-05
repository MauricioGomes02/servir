import { context, trace } from '@opentelemetry/api';
import { runInSpan } from '@servir/node-observability';

const tracer = trace.getTracer('@servir/api');

export async function traceUseCase<TResult>(
  name: string,
  execute: () => Promise<TResult>,
): Promise<TResult> {
  return runInSpan(
    tracer,
    name,
    context.active(),
    { attributes: { 'servir.use_case.name': name } },
    execute,
  );
}

import { SpanStatusCode, trace } from '@opentelemetry/api';

const tracer = trace.getTracer('@servir/api');

export async function traceUseCase<TResult>(
  name: string,
  execute: () => Promise<TResult>,
): Promise<TResult> {
  return tracer.startActiveSpan(name, async (span) => {
    span.setAttribute('servir.use_case.name', name);

    try {
      return await execute();
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

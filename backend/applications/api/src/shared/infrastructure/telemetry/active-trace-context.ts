import { context, propagation } from '@opentelemetry/api';

import type { DistributedTraceContext } from '@/shared/infrastructure/messaging';

export function captureActiveTraceContext(): DistributedTraceContext | undefined {
  const carrier: Record<string, string> = {};

  propagation.inject(context.active(), carrier);

  if (carrier.traceparent === undefined) {
    return undefined;
  }

  return Object.freeze({
    traceparent: carrier.traceparent,
    tracestate: carrier.tracestate,
  });
}

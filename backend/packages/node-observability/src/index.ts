export { JsonStdoutLogger } from './json-stdout-logger.js';
export type {
  ActiveTraceContext,
  ActiveTraceContextReader,
  LogLineWriter,
} from './json-stdout-logger.js';

export { createErrorLogAttributes } from './error-log-attributes.js';
export type { ErrorLogAttributeOptions } from './error-log-attributes.js';

export {
  captureActiveTraceContext,
  createPgInstrumentation,
  extractTraceContext,
  OpenTelemetryError,
  OpenTelemetryErrorCodes,
  recordSpanFailure,
  runInSpan,
  startOpenTelemetry,
} from './open-telemetry.js';
export type {
  DistributedTraceContext,
  OpenTelemetryErrorCode,
  StartOpenTelemetryOptions,
  TelemetryLifecycle,
  TelemetrySdk,
} from './open-telemetry.js';

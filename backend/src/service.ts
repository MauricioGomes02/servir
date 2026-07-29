import {
  createLogRecord,
  LogLevels,
  type LogAttributes,
} from '@/shared/application/logging';
import { JsonStdoutLogger } from '@/shared/infrastructure/logging';
import type { TelemetryLifecycle } from '@/shared/infrastructure/telemetry';

import { createApplication } from './composition';
import { readServiceConfig } from './service-config';

function failureAttributes(error: unknown): LogAttributes {
  if (!(error instanceof Error)) {
    return { 'error.type': typeof error };
  }

  const attributes: Record<string, string> = {
    'error.type': error.name,
    'exception.message': error.message,
  };

  if ('code' in error && typeof error.code === 'string') {
    attributes['error.code'] = error.code;
  }

  if (error.stack !== undefined) {
    attributes['exception.stacktrace'] = error.stack;
  }

  return attributes;
}

function reportFailure(
  logger: JsonStdoutLogger,
  eventName: string,
  error: unknown,
): void {
  logger.log(createLogRecord({
    level: LogLevels.Fatal,
    eventName,
    attributes: failureAttributes(error),
  }));
}

export function reportBootstrapFailure(error: unknown): void {
  reportFailure(new JsonStdoutLogger(), 'service.start.failed', error);
  process.exitCode = 1;
}

export async function startService(
  telemetry: TelemetryLifecycle,
): Promise<void> {
  const logger = new JsonStdoutLogger();

  try {
    const config = readServiceConfig(process.env);
    const app = createApplication({ logger });

    await app.listen({ ...config });
    logger.log(createLogRecord({
      level: LogLevels.Info,
      eventName: 'service.started',
      attributes: {
        'server.host': config.host,
        'server.port': config.port,
        'telemetry.enabled': telemetry.enabled,
      },
    }));

    let stopping: Promise<void> | undefined;
    const stop = (): Promise<void> => {
      stopping ??= (async () => {
        try {
          await app.close();
        } finally {
          await telemetry.shutdown();
        }
      })();

      return stopping;
    };

    const stopOnSignal = (): void => {
      void stop().catch((error: unknown) => {
        reportFailure(logger, 'service.stop.failed', error);
        process.exitCode = 1;
      });
    };

    process.once('SIGINT', stopOnSignal);
    process.once('SIGTERM', stopOnSignal);
  } catch (error) {
    reportFailure(logger, 'service.start.failed', error);

    try {
      await telemetry.shutdown();
    } catch (shutdownError) {
      reportFailure(logger, 'telemetry.shutdown.failed', shutdownError);
    }

    process.exitCode = 1;
  }
}

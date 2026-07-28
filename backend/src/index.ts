import {
  createLogRecord,
  LogLevels,
  type LogAttributes,
} from '@/shared/application/logging';
import { JsonStdoutLogger } from '@/shared/infrastructure/logging';

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

async function startService(): Promise<void> {
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
      },
    }));

    const stop = async () => {
      await app.close();
    };

    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  } catch (error) {
    logger.log(createLogRecord({
      level: LogLevels.Fatal,
      eventName: 'service.start.failed',
      attributes: failureAttributes(error),
    }));
    process.exitCode = 1;
  }
}

void startService();

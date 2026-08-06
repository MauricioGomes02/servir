import {
  createLogRecord,
  LogLevels,
} from '@/shared/application/logging';
import {
  createErrorLogAttributes,
  JsonStdoutLogger,
} from '@/shared/infrastructure/logging';
import type { TelemetryLifecycle } from '@/shared/infrastructure/telemetry';

import {
  createApplication,
  createPostgresPersistence,
  type PostgresPersistence,
} from './composition';
import { readServiceConfig } from './service-config';

function reportFailure(
  logger: JsonStdoutLogger,
  eventName: string,
  error: unknown,
): void {
  logger.log(createLogRecord({
    level: LogLevels.Fatal,
    eventName,
    attributes: createErrorLogAttributes(error, {
      fallbackCode: eventName,
      includeDetails: process.env.NODE_ENV === 'development',
    }),
  }));
}

export function reportBootstrapFailure(error: unknown): void {
  reportFailure(new JsonStdoutLogger(), 'service.start.failed', error);
  process.exitCode = 1;
}

export async function startService(
  telemetry: TelemetryLifecycle,
): Promise<void> {
  let logger = new JsonStdoutLogger();

  try {
    const config = readServiceConfig(process.env);
    logger = new JsonStdoutLogger(undefined, undefined, config.logLevel);
    let postgresPersistence: PostgresPersistence | undefined;

    if (config.persistence.mode === 'postgres') {
      postgresPersistence = createPostgresPersistence(
        config.persistence.connectionString,
      );
    }

    const app = createApplication({
      logger,
      memberUnitOfWork: postgresPersistence?.memberUnitOfWork,
      memberDetailsReader: postgresPersistence?.memberDetailsReader,
      organizationRegistrationFacts:
        postgresPersistence?.organizationRegistrationFacts,
      organizationUnitOfWork: postgresPersistence?.unitOfWork,
      ministryUnitOfWork: postgresPersistence?.ministryUnitOfWork,
      ministryCreationFacts: postgresPersistence?.ministryCreationFacts,
    });

    if (postgresPersistence !== undefined) {
      app.addHook('onClose', async () => {
        await postgresPersistence?.close();
      });
    }

    await app.listen({ host: config.host, port: config.port });
    logger.log(createLogRecord({
      level: LogLevels.Info,
      eventName: 'service.started',
      attributes: {
        'server.host': config.host,
        'server.port': config.port,
        'persistence.mode': config.persistence.mode,
        'telemetry.enabled': telemetry.enabled,
        'log.level': config.logLevel,
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

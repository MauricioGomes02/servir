import { ProcessOutboxBatch, ExponentialBackoffRetryPolicy } from '@/application';
import {
  createKafkaJsProducer,
  JsonStdoutLogger,
  KafkaIntegrationEventPublisher,
  OpenTelemetryRelayTelemetry,
  PostgresOutboxMessageStore,
  SystemClock,
  SystemRandomSource,
  UuidV7LeaseIdGenerator,
  type TelemetryLifecycle,
} from '@/infrastructure';
import {
  createLogRecord,
  LogLevels,
  type Logger,
  type LogAttributes,
  type LogLevel,
} from '@servir/application-foundation';
import { createErrorLogAttributes } from '@servir/node-observability';
import { OutboxRelayWorker } from '@/runtime';
import { Pool } from 'pg';

import { readRelayServiceConfig } from './service-config';

function failureAttributes(error: unknown, fallbackCode: string): LogAttributes {
  return createErrorLogAttributes(error, {
    fallbackCode,
    includeDetails: process.env.NODE_ENV === 'development',
  });
}

function log(
  logger: Logger,
  clock: SystemClock,
  level: LogLevel,
  eventName: string,
  attributes: LogAttributes = {},
): void {
  try {
    logger.log(
      createLogRecord({
        occurredAt: clock.now(),
        level,
        eventName,
        attributes,
      }),
    );
  } catch {
    // Service lifecycle cannot depend on an observability destination.
  }
}

export async function startRelayService(telemetry: TelemetryLifecycle): Promise<void> {
  let logger = new JsonStdoutLogger();
  const clock = new SystemClock();
  let pool: Pool | undefined;
  let producer: ReturnType<typeof createKafkaJsProducer> | undefined;
  const controller = new AbortController();
  const stopOnSignal = (): void => {
    log(logger, clock, LogLevels.Info, 'outbox.relay.shutdown.requested');
    controller.abort();
  };

  process.once('SIGINT', stopOnSignal);
  process.once('SIGTERM', stopOnSignal);

  try {
    const config = readRelayServiceConfig(process.env);
    logger = new JsonStdoutLogger(undefined, undefined, config.logLevel);
    pool = new Pool({ connectionString: config.databaseUrl });
    await pool.query('SELECT 1');
    producer = createKafkaJsProducer({
      clientId: config.kafkaClientId,
      brokers: config.kafkaBrokers,
      retryCount: config.kafkaRetryCount,
    });
    await producer.connect();

    const retryPolicy = new ExponentialBackoffRetryPolicy(clock, new SystemRandomSource(), {
      maximumAttempts: config.maximumAttempts,
      baseDelayMilliseconds: config.retryBaseDelayMilliseconds,
      maximumDelayMilliseconds: config.retryMaximumDelayMilliseconds,
      jitterRatio: config.retryJitterRatio,
    });
    const batchProcessor = new ProcessOutboxBatch({
      clock,
      leaseIdGenerator: new UuidV7LeaseIdGenerator(),
      messageStore: new PostgresOutboxMessageStore(pool),
      publisher: new KafkaIntegrationEventPublisher({
        producer,
        timeoutMs: config.publishTimeoutMilliseconds,
      }),
      retryPolicy,
      batchSize: config.batchSize,
      leaseDurationMilliseconds: config.leaseDurationMilliseconds,
      telemetry: new OpenTelemetryRelayTelemetry(),
      onBatchCompleted: (result) => {
        log(logger, clock, LogLevels.Info, 'outbox.relay.batch.completed', {
          claimed: result.claimed,
          published: result.published,
          rescheduled: result.rescheduled,
          failed: result.failed,
        });
      },
    });
    const worker = new OutboxRelayWorker({
      batchProcessor,
      batchSize: config.batchSize,
      pollIntervalMilliseconds: config.pollIntervalMilliseconds,
      clock,
      logger,
    });

    log(logger, clock, LogLevels.Info, 'outbox.relay.started', {
      'telemetry.enabled': telemetry.enabled,
      'batch.size': config.batchSize,
      'log.level': config.logLevel,
    });
    await worker.run(controller.signal);
  } catch (error) {
    log(
      logger,
      clock,
      LogLevels.Error,
      'outbox.relay.service.failed',
      failureAttributes(error, 'outbox.relay.service_failed'),
    );
    throw error;
  } finally {
    process.removeListener('SIGINT', stopOnSignal);
    process.removeListener('SIGTERM', stopOnSignal);

    if (producer !== undefined) {
      try {
        await producer.disconnect();
      } catch (error) {
        process.exitCode = 1;
        log(
          logger,
          clock,
          LogLevels.Error,
          'outbox.relay.kafka.disconnect.failed',
          failureAttributes(error, 'outbox.relay.service_failed'),
        );
      }
    }

    if (pool !== undefined) {
      try {
        await pool.end();
      } catch (error) {
        process.exitCode = 1;
        log(
          logger,
          clock,
          LogLevels.Error,
          'outbox.relay.postgres.close.failed',
          failureAttributes(error, 'outbox.relay.service_failed'),
        );
      }
    }

    try {
      await telemetry.shutdown();
    } catch (error) {
      process.exitCode = 1;
      log(
        logger,
        clock,
        LogLevels.Error,
        'outbox.relay.telemetry.shutdown.failed',
        failureAttributes(error, 'outbox.relay.service_failed'),
      );
    }

    log(logger, clock, LogLevels.Info, 'outbox.relay.stopped');
  }
}

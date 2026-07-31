import { ProcessOutboxBatch, ExponentialBackoffRetryPolicy } from '@/application';
import {
  createKafkaJsProducer,
  JsonStdoutRelayLogger,
  KafkaIntegrationEventPublisher,
  PostgresOutboxMessageStore,
  SystemClock,
  SystemRandomSource,
  UuidV7LeaseIdGenerator,
  type RelayLogger,
  type TelemetryLifecycle,
} from '@/infrastructure';
import { OutboxRelayWorker } from '@/runtime';
import { Pool } from 'pg';

import { readRelayServiceConfig } from './service-config';

function failureCode(error: unknown): string {
  if (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && typeof error.code === 'string'
  ) {
    return error.code;
  }

  return 'outbox.relay.service_failed';
}

function log(
  logger: RelayLogger,
  clock: SystemClock,
  severity: 'info' | 'error',
  name: string,
  attributes?: Readonly<Record<string, string | number | boolean>>,
): void {
  try {
    logger.log({ timestamp: clock.now(), severity, name, attributes });
  } catch {
    // Service lifecycle cannot depend on an observability destination.
  }
}

export async function startRelayService(
  telemetry: TelemetryLifecycle,
): Promise<void> {
  const logger = new JsonStdoutRelayLogger();
  const clock = new SystemClock();
  let pool: Pool | undefined;
  let producer: ReturnType<typeof createKafkaJsProducer> | undefined;
  const controller = new AbortController();
  const stopOnSignal = (): void => {
    log(logger, clock, 'info', 'outbox.relay.shutdown.requested');
    controller.abort();
  };

  process.once('SIGINT', stopOnSignal);
  process.once('SIGTERM', stopOnSignal);

  try {
    const config = readRelayServiceConfig(process.env);
    pool = new Pool({ connectionString: config.databaseUrl });
    await pool.query('SELECT 1');
    producer = createKafkaJsProducer({
      clientId: config.kafkaClientId,
      brokers: config.kafkaBrokers,
      retryCount: config.kafkaRetryCount,
    });
    await producer.connect();

    const retryPolicy = new ExponentialBackoffRetryPolicy(
      clock,
      new SystemRandomSource(),
      {
        maximumAttempts: config.maximumAttempts,
        baseDelayMilliseconds: config.retryBaseDelayMilliseconds,
        maximumDelayMilliseconds: config.retryMaximumDelayMilliseconds,
        jitterRatio: config.retryJitterRatio,
      },
    );
    const batchProcessor = new ProcessOutboxBatch({
      clock,
      leaseIdGenerator: new UuidV7LeaseIdGenerator(),
      messageStore: new PostgresOutboxMessageStore(pool),
      publisher: new KafkaIntegrationEventPublisher({
        producer,
        topic: config.kafkaTopic,
        source: 'urn:servir:organizations',
        typePrefix: 'com.servir.organizations',
        timeoutMs: config.publishTimeoutMilliseconds,
      }),
      retryPolicy,
      batchSize: config.batchSize,
      leaseDurationMilliseconds: config.leaseDurationMilliseconds,
    });
    const worker = new OutboxRelayWorker({
      batchProcessor,
      batchSize: config.batchSize,
      pollIntervalMilliseconds: config.pollIntervalMilliseconds,
      clock,
      logger,
    });

    log(logger, clock, 'info', 'outbox.relay.started', {
      'telemetry.enabled': telemetry.enabled,
      topic: config.kafkaTopic,
      'batch.size': config.batchSize,
    });
    await worker.run(controller.signal);
  } catch (error) {
    log(logger, clock, 'error', 'outbox.relay.service.failed', {
      'error.code': failureCode(error),
    });
    throw error;
  } finally {
    process.removeListener('SIGINT', stopOnSignal);
    process.removeListener('SIGTERM', stopOnSignal);

    if (producer !== undefined) {
      try {
        await producer.disconnect();
      } catch (error) {
        process.exitCode = 1;
        log(logger, clock, 'error', 'outbox.relay.kafka.disconnect.failed', {
          'error.code': failureCode(error),
        });
      }
    }

    if (pool !== undefined) {
      try {
        await pool.end();
      } catch (error) {
        process.exitCode = 1;
        log(logger, clock, 'error', 'outbox.relay.postgres.close.failed', {
          'error.code': failureCode(error),
        });
      }
    }

    try {
      await telemetry.shutdown();
    } catch (error) {
      process.exitCode = 1;
      log(logger, clock, 'error', 'outbox.relay.telemetry.shutdown.failed', {
        'error.code': failureCode(error),
      });
    }

    log(logger, clock, 'info', 'outbox.relay.stopped');
  }
}

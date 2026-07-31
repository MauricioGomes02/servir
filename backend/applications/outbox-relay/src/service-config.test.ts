import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  readRelayServiceConfig,
  RelayServiceConfigError,
  RelayServiceConfigErrorCodes,
} from './service-config';

const REQUIRED = {
  DATABASE_URL: 'postgresql://relay:secret@localhost:5432/servir',
  KAFKA_BROKERS: 'localhost:9092',
} as const;

describe('readRelayServiceConfig', () => {
  it('applies operational defaults to required endpoints', () => {
    assert.deepEqual(readRelayServiceConfig(REQUIRED), {
      databaseUrl: REQUIRED.DATABASE_URL,
      kafkaBrokers: ['localhost:9092'],
      kafkaClientId: 'servir-outbox-relay',
      kafkaTopic: 'servir.organizations.events',
      batchSize: 100,
      leaseDurationMilliseconds: 60_000,
      pollIntervalMilliseconds: 1_000,
      publishTimeoutMilliseconds: 10_000,
      kafkaRetryCount: 5,
      maximumAttempts: 10,
      retryBaseDelayMilliseconds: 1_000,
      retryMaximumDelayMilliseconds: 300_000,
      retryJitterRatio: 0.2,
    });
  });

  it('normalizes a list of Kafka brokers', () => {
    const config = readRelayServiceConfig({
      ...REQUIRED,
      KAFKA_BROKERS: ' kafka-1:9092, kafka-2:9092 ',
    });

    assert.deepEqual(config.kafkaBrokers, ['kafka-1:9092', 'kafka-2:9092']);
  });

  it('rejects each missing required endpoint with a stable code', () => {
    const partitions: Array<readonly [NodeJS.ProcessEnv, string]> = [
      [{ KAFKA_BROKERS: 'localhost:9092' }, RelayServiceConfigErrorCodes.MissingDatabaseUrl],
      [{ DATABASE_URL: REQUIRED.DATABASE_URL }, RelayServiceConfigErrorCodes.MissingKafkaBrokers],
    ];

    for (const [environment, code] of partitions) {
      assert.throws(
        () => readRelayServiceConfig(environment),
        (error: unknown) => error instanceof RelayServiceConfigError
          && error.code === code,
      );
    }
  });

  it('rejects non-positive and fractional integer configuration', () => {
    for (const value of ['0', '-1', '1.5', 'text']) {
      assert.throws(
        () => readRelayServiceConfig({ ...REQUIRED, OUTBOX_BATCH_SIZE: value }),
        (error: unknown) => error instanceof RelayServiceConfigError
          && error.code === RelayServiceConfigErrorCodes.InvalidInteger,
      );
    }
  });

  it('accepts the jitter boundaries and rejects values outside them', () => {
    assert.equal(readRelayServiceConfig({
      ...REQUIRED,
      OUTBOX_RETRY_JITTER_RATIO: '0',
    }).retryJitterRatio, 0);
    assert.equal(readRelayServiceConfig({
      ...REQUIRED,
      OUTBOX_RETRY_JITTER_RATIO: '1',
    }).retryJitterRatio, 1);

    for (const value of ['-0.01', '1.01', 'text']) {
      assert.throws(
        () => readRelayServiceConfig({
          ...REQUIRED,
          OUTBOX_RETRY_JITTER_RATIO: value,
        }),
        (error: unknown) => error instanceof RelayServiceConfigError
          && error.code === RelayServiceConfigErrorCodes.InvalidRatio,
      );
    }
  });

  it('requires the publication timeout to remain below the lease', () => {
    for (const timeout of ['60000', '60001']) {
      assert.throws(
        () => readRelayServiceConfig({
          ...REQUIRED,
          OUTBOX_LEASE_DURATION_MS: '60000',
          KAFKA_PUBLISH_TIMEOUT_MS: timeout,
        }),
        (error: unknown) => error instanceof RelayServiceConfigError
          && error.code === RelayServiceConfigErrorCodes.InvalidPublishTimeout,
      );
    }
  });
});

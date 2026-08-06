import { parseLogLevel, type LogLevel } from '@servir/application-foundation';

export const RelayServiceConfigErrorCodes = {
  MissingDatabaseUrl: 'relay.config.database_url.missing',
  MissingKafkaBrokers: 'relay.config.kafka_brokers.missing',
  InvalidInteger: 'relay.config.integer.invalid',
  InvalidRatio: 'relay.config.ratio.invalid',
  InvalidPublishTimeout: 'relay.config.publish_timeout.invalid',
  InvalidLogLevel: 'relay.config.log_level.invalid',
} as const;

export type RelayServiceConfigErrorCode = typeof RelayServiceConfigErrorCodes[
  keyof typeof RelayServiceConfigErrorCodes
];

export class RelayServiceConfigError extends Error {
  override readonly name = 'RelayServiceConfigError';

  constructor(readonly code: RelayServiceConfigErrorCode) {
    super(code);
  }
}

export interface RelayServiceConfig {
  readonly databaseUrl: string;
  readonly kafkaBrokers: readonly string[];
  readonly kafkaClientId: string;
  readonly batchSize: number;
  readonly leaseDurationMilliseconds: number;
  readonly pollIntervalMilliseconds: number;
  readonly publishTimeoutMilliseconds: number;
  readonly kafkaRetryCount: number;
  readonly maximumAttempts: number;
  readonly retryBaseDelayMilliseconds: number;
  readonly retryMaximumDelayMilliseconds: number;
  readonly retryJitterRatio: number;
  readonly logLevel: LogLevel;
}

function required(
  value: string | undefined,
  code: RelayServiceConfigErrorCode,
): string {
  const normalized = value?.trim();

  if (normalized === undefined || normalized.length === 0) {
    throw new RelayServiceConfigError(code);
  }

  return normalized;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? fallback : Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RelayServiceConfigError(
      RelayServiceConfigErrorCodes.InvalidInteger,
    );
  }

  return parsed;
}

function nonNegativeInteger(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? fallback : Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new RelayServiceConfigError(
      RelayServiceConfigErrorCodes.InvalidInteger,
    );
  }

  return parsed;
}

function ratio(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? fallback : Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new RelayServiceConfigError(RelayServiceConfigErrorCodes.InvalidRatio);
  }

  return parsed;
}

export function readRelayServiceConfig(
  environment: NodeJS.ProcessEnv,
): RelayServiceConfig {
  const databaseUrl = required(
    environment.DATABASE_URL,
    RelayServiceConfigErrorCodes.MissingDatabaseUrl,
  );
  const kafkaBrokers = required(
    environment.KAFKA_BROKERS,
    RelayServiceConfigErrorCodes.MissingKafkaBrokers,
  ).split(',').map((broker) => broker.trim()).filter(Boolean);

  if (kafkaBrokers.length === 0) {
    throw new RelayServiceConfigError(
      RelayServiceConfigErrorCodes.MissingKafkaBrokers,
    );
  }

  const leaseDurationMilliseconds = positiveInteger(
    environment.OUTBOX_LEASE_DURATION_MS,
    60_000,
  );
  const publishTimeoutMilliseconds = positiveInteger(
    environment.KAFKA_PUBLISH_TIMEOUT_MS,
    10_000,
  );

  if (publishTimeoutMilliseconds >= leaseDurationMilliseconds) {
    throw new RelayServiceConfigError(
      RelayServiceConfigErrorCodes.InvalidPublishTimeout,
    );
  }

  const logLevel = parseLogLevel(environment.LOG_LEVEL);
  if (logLevel === undefined) {
    throw new RelayServiceConfigError(
      RelayServiceConfigErrorCodes.InvalidLogLevel,
    );
  }

  return Object.freeze({
    databaseUrl,
    kafkaBrokers: Object.freeze(kafkaBrokers),
    kafkaClientId: environment.KAFKA_CLIENT_ID?.trim() || 'servir-outbox-relay',
    batchSize: positiveInteger(environment.OUTBOX_BATCH_SIZE, 100),
    leaseDurationMilliseconds,
    pollIntervalMilliseconds: positiveInteger(
      environment.OUTBOX_POLL_INTERVAL_MS,
      1_000,
    ),
    publishTimeoutMilliseconds,
    kafkaRetryCount: nonNegativeInteger(environment.KAFKA_RETRY_COUNT, 5),
    maximumAttempts: positiveInteger(environment.OUTBOX_MAX_ATTEMPTS, 10),
    retryBaseDelayMilliseconds: positiveInteger(
      environment.OUTBOX_RETRY_BASE_DELAY_MS,
      1_000,
    ),
    retryMaximumDelayMilliseconds: positiveInteger(
      environment.OUTBOX_RETRY_MAX_DELAY_MS,
      300_000,
    ),
    retryJitterRatio: ratio(environment.OUTBOX_RETRY_JITTER_RATIO, 0.2),
    logLevel,
  });
}

import type { CorrelationId } from '@/shared/application/context';

import {
  createLogRecord,
  type LogContext,
} from '.';

declare const correlationId: CorrelationId;

const context: LogContext = { correlationId };
void context;

createLogRecord({
  // @ts-expect-error Nivel de log deve pertencer ao contrato.
  level: 'verbose',
  eventName: 'test.invalid_level',
  attributes: {},
});

// @ts-expect-error Contexto de log exige CorrelationId.
const contextWithoutCorrelation: LogContext = {};
void contextWithoutCorrelation;

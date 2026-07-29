import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createLogRecord,
  LogLevels,
} from '@/shared/application/logging';

import { JsonStdoutLogger } from './json-stdout-logger';

describe('JsonStdoutLogger', () => {
  it('escreve um registro estruturado por linha', () => {
    const lines: string[] = [];
    const logger = new JsonStdoutLogger((line) => lines.push(line));

    logger.log(createLogRecord({
      level: LogLevels.Info,
      eventName: 'service.started',
      attributes: {
        'server.host': '127.0.0.1',
        'server.port': 3000,
      },
    }));

    assert.equal(lines.length, 1);
    assert.equal(lines[0]?.endsWith('\n'), true);
    assert.deepEqual(JSON.parse(lines[0] ?? ''), {
      level: 'info',
      eventName: 'service.started',
      attributes: {
        'server.host': '127.0.0.1',
        'server.port': 3000,
      },
    });
  });

  it('limita valores tecnicos extensos antes de escrever', () => {
    const lines: string[] = [];
    const logger = new JsonStdoutLogger((line) => lines.push(line));

    logger.log(createLogRecord({
      level: LogLevels.Error,
      eventName: 'http.request.failed',
      attributes: {
        'exception.stacktrace': 'x'.repeat(20_000),
      },
    }));

    const output = JSON.parse(lines[0] ?? '') as {
      attributes: Record<string, string>;
    };
    const stacktrace = output.attributes['exception.stacktrace'];

    assert.ok(stacktrace);
    assert.equal(stacktrace.length, 8_192);
    assert.equal(stacktrace.endsWith('...[truncated]'), true);
  });

  it('acrescenta trace e span ativos sem alterar o port de logging', () => {
    const lines: string[] = [];
    const logger = new JsonStdoutLogger(
      (line) => lines.push(line),
      () => ({
        traceId: '0af7651916cd43dd8448eb211c80319c',
        spanId: 'b7ad6b7169203331',
      }),
    );

    logger.log(createLogRecord({
      level: LogLevels.Info,
      eventName: 'http.request.completed',
      attributes: {},
    }));

    const output = JSON.parse(lines[0] ?? '') as Record<string, unknown>;

    assert.equal(output.traceId, '0af7651916cd43dd8448eb211c80319c');
    assert.equal(output.spanId, 'b7ad6b7169203331');
  });

  it('nao propaga uma falha do destino de observabilidade', () => {
    const logger = new JsonStdoutLogger(() => {
      throw new Error('stdout unavailable');
    });

    assert.doesNotThrow(() => logger.log(createLogRecord({
      level: LogLevels.Error,
      eventName: 'http.request.failed',
      attributes: {},
    })));
  });
});

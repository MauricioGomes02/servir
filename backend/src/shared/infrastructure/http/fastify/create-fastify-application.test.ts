import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  parseCorrelationId,
  parseRequestId,
  type CorrelationId,
  type RequestId,
} from '@/shared/application/context';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import type { MessageCatalog } from '@/shared/presentation';

import { createFastifyApplication } from '.';

const REQUEST_ID = '0198f334-6dc5-7c20-9af1-91d7e599c7b1';

const catalog: MessageCatalog = {
  'pt-BR': {},
  'en-US': {},
};

function correlationId(value: string): CorrelationId {
  const result = parseCorrelationId(value);
  assert.equal(result.success, true);

  if (!result.success) {
    throw new Error('Invalid deterministic test fixture');
  }

  return result.value;
}

function requestId(value: string): RequestId {
  const result = parseRequestId(value);
  assert.equal(result.success, true);

  if (!result.success) {
    throw new Error('Invalid deterministic test fixture');
  }

  return result.value;
}

function application(generatedCorrelationId = 'correlation-generated') {
  const logger = new InMemoryLogger();
  const app = createFastifyApplication({
    correlationIdGenerator: new SequenceIdGenerator([
      correlationId(generatedCorrelationId),
    ]),
    logger,
    messageTranslator: new InMemoryMessageTranslator(catalog),
    requestIdGenerator: new SequenceIdGenerator([
      requestId(REQUEST_ID),
    ]),
  });

  return { app, logger };
}

describe('createFastifyApplication', () => {
  it('creates context from the request and exposes effective IDs', async () => {
    const { app } = application();
    app.get('/context', async (request) => ({
      correlationId: request.executionContext?.correlationId,
      requestId: request.executionContext?.requestId,
      locale: request.locale,
    }));

    const response = await app.inject({
      method: 'GET',
      url: '/context',
      headers: {
        'x-correlation-id': 'correlation-received',
        'accept-language': 'en-US,pt-BR;q=0.8',
      },
    });
    await app.close();

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['x-correlation-id'], 'correlation-received');
    assert.equal(response.headers['x-request-id'], REQUEST_ID);
    assert.deepEqual(response.json(), {
      correlationId: 'correlation-received',
      requestId: REQUEST_ID,
      locale: 'en-US',
    });
  });

  it('generates correlation and selects the first supported language', async () => {
    const { app } = application();
    app.get('/context', async (request) => ({
      correlationId: request.executionContext?.correlationId,
      locale: request.locale,
    }));

    const response = await app.inject({
      method: 'GET',
      url: '/context',
      headers: {
        'accept-language': 'es,en;q=0.8',
      },
    });
    await app.close();

    assert.deepEqual(response.json(), {
      correlationId: 'correlation-generated',
      locale: 'en-US',
    });
  });

  it('does not approximate an unsupported region', async () => {
    const { app } = application();
    app.get('/locale', async (request) => ({ locale: request.locale }));

    const response = await app.inject({
      method: 'GET',
      url: '/locale',
      headers: {
        'accept-language': 'en-GB',
      },
    });
    await app.close();

    assert.deepEqual(response.json(), { locale: 'pt-BR' });
  });

  it('hides technical failure details and preserves correlation', async () => {
    const { app, logger } = application();
    app.get('/failure', async () => {
      throw new Error('secret technical detail');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/failure',
      headers: {
        'accept-language': 'en',
      },
    });
    await app.close();

    assert.equal(response.statusCode, 500);
    assert.equal(response.headers['x-correlation-id'], 'correlation-generated');
    assert.match(
      response.headers['content-type'] ?? '',
      /^application\/problem\+json/,
    );
    assert.equal(response.headers['content-language'], 'en-US');
    assert.deepEqual(response.json(), {
      type: '/problems/internal-error',
      title: 'The request could not be processed.',
      status: 500,
      instance: `urn:servir:request:${REQUEST_ID}`,
      correlationId: 'correlation-generated',
    });
    assert.equal(response.body.includes('secret technical detail'), false);
    assert.equal(logger.records.length, 1);
    const [record] = logger.records;
    assert.ok(record);
    assert.deepEqual({
      ...record,
      attributes: {
        ...record.attributes,
        'exception.stacktrace': undefined,
      },
    }, {
      level: 'error',
      eventName: 'http.request.failed',
      context: {
        correlationId: 'correlation-generated',
        requestId: REQUEST_ID,
      },
      attributes: {
        'http.request.method': 'GET',
        'http.route': '/failure',
        'http.response.status_code': 500,
        'error.type': 'Error',
        'exception.message': 'secret technical detail',
        'exception.stacktrace': undefined,
      },
    });
    assert.equal(
      typeof record.attributes['exception.stacktrace'],
      'string',
    );
  });

  it('does not automatically log an expected client failure', async () => {
    const { app, logger } = application();
    app.get('/invalid', async () => {
      throw Object.assign(new Error('invalid input'), { statusCode: 400 });
    });

    const response = await app.inject({
      method: 'GET',
      url: '/invalid',
    });
    await app.close();

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), {
      type: '/problems/invalid-request',
      title: 'Nao foi possivel processar a solicitacao.',
      status: 400,
      instance: `urn:servir:request:${REQUEST_ID}`,
      correlationId: 'correlation-generated',
    });
    assert.equal(logger.records.length, 0);
  });

  it('presents malformed JSON as Problem Details', async () => {
    const { app, logger } = application();
    app.post('/payload', async () => ({ accepted: true }));

    const response = await app.inject({
      method: 'POST',
      url: '/payload',
      headers: {
        'content-type': 'application/json',
        'accept-language': 'en-US',
      },
      payload: '{"name":',
    });
    await app.close();

    assert.equal(response.statusCode, 400);
    assert.match(
      response.headers['content-type'] ?? '',
      /^application\/problem\+json/,
    );
    assert.deepEqual(response.json(), {
      type: '/problems/invalid-request',
      title: 'The request could not be processed.',
      status: 400,
      instance: `urn:servir:request:${REQUEST_ID}`,
      correlationId: 'correlation-generated',
    });
    assert.equal(logger.records.length, 0);
  });
});

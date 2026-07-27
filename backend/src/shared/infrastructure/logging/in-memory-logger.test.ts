import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  LogLevels,
  type LogRecord,
} from '@/shared/application/logging';

import { InMemoryLogger } from '.';

describe('InMemoryLogger', () => {
  it('armazena registros em ordem e expoe snapshot imutavel', () => {
    const logger = new InMemoryLogger();
    const first: LogRecord = {
      level: LogLevels.Info,
      eventName: 'organization.created',
      attributes: {
        'organization.id': 'organization-123',
      },
    };
    const second: LogRecord = {
      level: LogLevels.Warn,
      eventName: 'organization.creation_delayed',
      attributes: {
        'duration.ms': 250,
      },
    };

    logger.log(first);
    const snapshot = logger.records;
    logger.log(second);

    assert.equal(Object.isFrozen(snapshot), true);
    assert.deepEqual(
      snapshot.map((record) => record.eventName),
      ['organization.created'],
    );
    assert.deepEqual(
      logger.records.map((record) => record.eventName),
      [
        'organization.created',
        'organization.creation_delayed',
      ],
    );
  });

  it('faz copia defensiva do registro recebido', () => {
    const logger = new InMemoryLogger();
    const attributes = {
      fields: ['name'],
    };

    logger.log({
      level: LogLevels.Debug,
      eventName: 'organization.change_observed',
      attributes,
    });
    attributes.fields.push('slug');

    assert.deepEqual(logger.records[0]?.attributes, {
      fields: ['name'],
    });
  });
});

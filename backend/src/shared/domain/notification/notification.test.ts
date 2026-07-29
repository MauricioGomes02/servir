import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Notification } from '.';

describe('Notification', () => {
  it('accumulates and queries errors by code and field', () => {
    const notification = new Notification<
      'organization.name.empty' | 'organization.slug.empty'
    >();

    notification
      .add({
        code: 'organization.name.empty',
        field: 'name',
      })
      .add({
        code: 'organization.slug.empty',
        field: 'slug',
      });

    assert.equal(notification.hasErrors(), true);
    assert.equal(notification.isValid(), false);
    assert.equal(notification.size, 2);
    assert.equal(
      notification.hasErrorCode('organization.name.empty'),
      true,
    );
    assert.equal(notification.hasErrorForField('slug'), true);
    assert.equal(notification.getErrorsForField('name').length, 1);
  });

  it('protects errors and snapshots from external mutation', () => {
    const params = { maxLength: 120 };
    const error = {
      code: 'organization.name.max_length' as const,
      field: 'name',
      params,
    };
    const notification = new Notification<
      'organization.name.max_length'
    >();

    notification.add(error);
    params.maxLength = 240;
    const errors = notification.getErrors();

    assert.equal(errors[0]?.params?.maxLength, 120);
    assert.equal(Object.isFrozen(errors), true);
    assert.equal(Object.isFrozen(errors[0]), true);
    assert.equal(Object.isFrozen(errors[0]?.params), true);
  });

  it('combines notifications without sharing mutable errors', () => {
    const source = new Notification<'organization.name.empty'>()
      .add({ code: 'organization.name.empty', field: 'name' });
    const target = new Notification<'organization.name.empty'>()
      .merge(source);

    assert.deepEqual(target.getErrors(), source.getErrors());
    assert.notEqual(target.getErrors(), source.getErrors());
  });
});

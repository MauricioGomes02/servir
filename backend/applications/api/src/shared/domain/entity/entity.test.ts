import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Entity, EntityId } from '.';

class TestEntityId extends EntityId<'TestEntityId'> {
  static create(value: string): TestEntityId {
    return new TestEntityId(value);
  }
}

class TestEntity extends Entity<TestEntityId, { name: string }> {
  static create(id: TestEntityId, name: string): TestEntity {
    return new TestEntity(id, { name });
  }

  rename(name: string): void {
    this.props.name = name;
  }
}

describe('Entity', () => {
  it('compares entities by identity despite state changes', () => {
    const id = TestEntityId.create('entity-123');
    const first = TestEntity.create(id, 'first');
    const second = TestEntity.create(TestEntityId.create('entity-123'), 'second');

    first.rename('changed');

    assert.equal(first.equals(second), true);
  });

  it('distinguishes entities with different identities', () => {
    const first = TestEntity.create(TestEntityId.create('entity-123'), 'same');
    const second = TestEntity.create(TestEntityId.create('entity-456'), 'same');

    assert.equal(first.equals(second), false);
    assert.equal(first.equals(null), false);
  });
});

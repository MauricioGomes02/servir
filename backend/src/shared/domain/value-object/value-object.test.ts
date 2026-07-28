import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ValueObject } from '.';

interface TestValueProps {
  readonly label: string;
  readonly metadata: {
    readonly tags: ReadonlyArray<string>;
  };
}

class TestValue extends ValueObject<TestValueProps, 'TestValue'> {
  constructor(props: TestValueProps) {
    super(props);
  }

  get tags(): ReadonlyArray<string> {
    return this.props.metadata.tags;
  }
}

describe('ValueObject', () => {
  it('compara valores pelo conteudo', () => {
    const first = new TestValue({
      label: 'value',
      metadata: { tags: ['first'] },
    });
    const second = new TestValue({
      label: 'value',
      metadata: { tags: ['first'] },
    });
    const different = new TestValue({
      label: 'other',
      metadata: { tags: ['first'] },
    });

    assert.equal(first.equals(second), true);
    assert.equal(first.equals(different), false);
    assert.equal(first.equals(null), false);
  });

  it('copia e congela profundamente propriedades estruturadas', () => {
    const tags = ['first'];
    const props = {
      label: 'value',
      metadata: { tags },
    };
    const value = new TestValue(props);

    tags.push('changed');
    props.metadata.tags = ['replaced'];

    assert.deepEqual(value.tags, ['first']);
    assert.equal(Object.isFrozen(value.tags), true);
  });
});

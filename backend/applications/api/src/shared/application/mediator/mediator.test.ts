import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createExecutionContext, parseCorrelationId } from '../context';
import {
  defineMessage,
  DuplicateMessageHandlerError,
  Mediator,
  UnregisteredMessageHandlerError,
} from '.';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('fixture');
  return result.value;
}
const token = defineMessage<Readonly<{ value: number }>, number>('test.double', 'DoubleValue');
const context = createExecutionContext({
  correlationId: value(parseCorrelationId('mediator-test')),
});

describe('Mediator', () => {
  it('dispatches a typed message with its explicit execution context', async () => {
    const traces: string[] = [];
    const mediator = new Mediator(async (name, execute) => {
      traces.push(name);
      return execute();
    });
    mediator.register(token, async (input, receivedContext) => {
      assert.equal(receivedContext, context);
      return input.value * 2;
    });
    assert.equal(await mediator.send(token, { value: 4 }, context), 8);
    assert.deepEqual(traces, ['DoubleValue']);
  });
  it('rejects duplicate and missing registrations with stable errors', async () => {
    const mediator = new Mediator();
    mediator.register(token, async () => 1);
    assert.throws(() => mediator.register(token, async () => 2), DuplicateMessageHandlerError);
    const missing = defineMessage<void, void>('test.missing', 'Missing');
    await assert.rejects(
      mediator.send(missing, undefined, context),
      UnregisteredMessageHandlerError,
    );
  });
});

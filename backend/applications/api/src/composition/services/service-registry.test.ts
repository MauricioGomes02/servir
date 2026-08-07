import assert from 'node:assert/strict';
import { it } from 'node:test';
import {
  defineService,
  DuplicateServiceRegistrationError,
  ServiceRegistry,
  UnregisteredServiceError,
} from './service-registry';

it('resolves values by typed token and rejects invalid registrations', () => {
  const token = defineService<number>('test.number');
  const missing = defineService<string>('test.missing');
  const registry = new ServiceRegistry();
  registry.add(token, 42);
  assert.equal(registry.get(token), 42);
  assert.throws(() => registry.add(token, 7), DuplicateServiceRegistrationError);
  assert.throws(() => registry.get(missing), UnregisteredServiceError);
});

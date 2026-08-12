import { describe, expect, it } from 'vitest';
import { readBffConfig } from './config.js';

describe('readBffConfig', () => {
  it('requires the private api endpoint', () => {
    expect(() => readBffConfig({})).toThrow('API_BASE_URL is required');
  });

  it('applies safe listener defaults', () => {
    expect(readBffConfig({ API_BASE_URL: 'http://api:3000' })).toMatchObject({
      apiTimeoutMs: 10_000,
      host: '0.0.0.0',
      port: 3001,
    });
  });

  it('rejects a non-positive upstream timeout', () => {
    expect(() => readBffConfig({ API_BASE_URL: 'http://api:3000', API_TIMEOUT_MS: '0' })).toThrow(
      'API_TIMEOUT_MS must be a positive integer',
    );
  });
});

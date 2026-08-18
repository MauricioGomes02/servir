import { describe, expect, it } from 'vitest';
import { supportedQuerySuffix } from './api-forwarder.js';

describe('supportedQuerySuffix', () => {
  it('serializes only the filters owned by the route module', () => {
    expect(
      supportedQuerySuffix({ page: '2', search: 'Música e arte', ignored: 'value' }, [
        'page',
        'search',
      ]),
    ).toBe('?page=2&search=M%C3%BAsica+e+arte');
  });

  it('does not append a question mark without supported values', () => {
    expect(supportedQuerySuffix({ page: undefined }, ['page'])).toBe('');
  });
});

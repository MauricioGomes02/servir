import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { BffProblemCodes } from './bff-problem-code.js';
import { BffMessageKeys } from './localization.js';
import { sendBffProblem } from './problem-details.js';

describe('BFF Problem Details', () => {
  it('localizes presentation without changing the stable error code', async () => {
    const app = Fastify();
    app.get('/', (request, reply) =>
      sendBffProblem(request, reply, {
        code: BffProblemCodes.UpstreamUnavailable,
        messageKey: BffMessageKeys.UpstreamUnavailable,
        status: 502,
        type: '/problems/upstream-unavailable',
      }),
    );

    const portuguese = await app.inject({ method: 'GET', url: '/' });
    const english = await app.inject({
      method: 'GET',
      url: '/',
      headers: { 'accept-language': 'en-US' },
    });
    await app.close();

    expect(portuguese.json().errors[0].code).toBe(BffProblemCodes.UpstreamUnavailable);
    expect(english.json().errors[0].code).toBe(BffProblemCodes.UpstreamUnavailable);
    expect(portuguese.json().errors[0].detail).not.toBe(english.json().errors[0].detail);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import type { MessageTranslator } from '@/shared/presentation/localization';
import { SupportedLocales } from '@/shared/presentation/localization';

import { presentError } from '.';

describe('presentError', () => {
  it('presents a localized error with parameters and correlation', () => {
    const correlationId = parseCorrelationId('correlation-123');
    assert.equal(correlationId.success, true);

    if (!correlationId.success) {
      throw new Error('Invalid deterministic test fixture');
    }

    const translator: MessageTranslator = {
      translate: ({ code, locale, parameters }) => `${locale}:${code}:${parameters?.maxLength}`,
    };
    const presented = presentError(
      {
        code: 'organization.name.too_long',
        field: 'name',
        params: { maxLength: 120 },
      },
      createExecutionContext({ correlationId: correlationId.value }),
      SupportedLocales.PortugueseBrazil,
      translator,
    );

    assert.deepEqual(presented, {
      code: 'organization.name.too_long',
      message: 'pt-BR:organization.name.too_long:120',
      field: 'name',
      parameters: { maxLength: 120 },
      correlationId: correlationId.value,
    });
    assert.equal(Object.isFrozen(presented), true);
    assert.equal(Object.isFrozen(presented.parameters), true);
  });
});

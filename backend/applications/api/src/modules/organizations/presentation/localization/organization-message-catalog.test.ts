import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OrganizationNameErrorCodes } from '@/modules/organizations/domain';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import { SupportedLocales } from '@/shared/presentation/localization';

import { organizationMessageCatalog } from '.';

describe('organizationMessageCatalog', () => {
  it('translates OrganizationName errors in supported locales', () => {
    const translator = new InMemoryMessageTranslator(organizationMessageCatalog);

    for (const locale of Object.values(SupportedLocales)) {
      for (const code of Object.values(OrganizationNameErrorCodes)) {
        assert.equal(Object.hasOwn(organizationMessageCatalog[locale], code), true);

        const message = translator.translate({
          code,
          locale,
          parameters: { maxLength: 120 },
        });

        assert.equal(message.length > 0, true);
        assert.doesNotMatch(message, /\{maxLength\}/);
      }
    }
  });
});

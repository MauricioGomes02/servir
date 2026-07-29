import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OrganizationId } from '@/modules/organizations/domain';
import {
  createExecutionContext,
  parseCorrelationId,
} from '@/shared/application/context';
import { failure, success } from '@/shared/core/result';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import { SupportedLocales } from '@/shared/presentation';

import {
  organizationMessageCatalog,
} from '../localization';
import { CreateOrganizationPresenter } from '.';

function context() {
  const correlationId = parseCorrelationId('correlation-123');
  assert.equal(correlationId.success, true);

  if (!correlationId.success) {
    throw new Error('Invalid deterministic test fixture');
  }

  return createExecutionContext({ correlationId: correlationId.value });
}

function presenter(): CreateOrganizationPresenter {
  return new CreateOrganizationPresenter(
    new InMemoryMessageTranslator(organizationMessageCatalog),
  );
}

describe('CreateOrganizationPresenter', () => {
  it('presents the identifier without exposing the domain object', () => {
    const organizationId = OrganizationId.create(
      '0198f334-6dc5-7c20-9af1-91d7e599c7b1',
    );
    assert.equal(organizationId.success, true);

    if (!organizationId.success) {
      throw new Error('Invalid deterministic test fixture');
    }

    const view = presenter().present(
      success({
        organizationId: organizationId.value,
        name: 'Comunidade Servir',
      }),
      context(),
      SupportedLocales.PortugueseBrazil,
    );

    assert.deepEqual(view, {
      kind: 'success',
      resource: {
        id: '0198f334-6dc5-7c20-9af1-91d7e599c7b1',
        name: 'Comunidade Servir',
      },
    });
    assert.equal(Object.isFrozen(view), true);
    assert.equal(
      view.kind === 'success' && Object.isFrozen(view.resource),
      true,
    );
  });

  it('presents the expected failure in Portuguese with correlation', () => {
    const executionContext = context();
    const view = presenter().present(
      failure({
        code: 'organization.name.empty',
        field: 'name',
      }),
      executionContext,
      SupportedLocales.PortugueseBrazil,
    );

    assert.deepEqual(view, {
      kind: 'failure',
      error: {
        code: 'organization.name.empty',
        message: 'Informe o nome da organizacao.',
        field: 'name',
        parameters: undefined,
        correlationId: executionContext.correlationId,
      },
    });
  });

  it('presents expected failure parameters in American English', () => {
    const executionContext = context();
    const view = presenter().present(
      failure({
        code: 'organization.name.too_long',
        field: 'name',
        params: {
          maxLength: 120,
          actualLength: 121,
        },
      }),
      executionContext,
      SupportedLocales.EnglishUnitedStates,
    );

    assert.deepEqual(view, {
      kind: 'failure',
      error: {
        code: 'organization.name.too_long',
        message: 'The organization name must have at most 120 characters.',
        field: 'name',
        parameters: {
          maxLength: 120,
          actualLength: 121,
        },
        correlationId: executionContext.correlationId,
      },
    });
    assert.equal(Object.isFrozen(view), true);
    assert.equal(view.kind === 'failure' && Object.isFrozen(view.error), true);
    assert.equal(
      view.kind === 'failure' && Object.isFrozen(view.error.parameters),
      true,
    );
  });
});

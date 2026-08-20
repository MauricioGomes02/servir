import type { MessageCatalog } from '@/shared/presentation';

export const identityMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    'authentication.bootstrap_assertion.expired':
      'A credencial de provisionamento expirou. Entre novamente para continuar.',
    'authentication.bootstrap_assertion.invalid':
      'A credencial de provisionamento não é válida.',
    'authentication.access_token.expired':
      'Sua sessão expirou. Entre novamente para continuar.',
    'authentication.access_token.invalid': 'A credencial de acesso nãoo é válida.',
    'authentication.access_token.missing': 'Entre na sua conta para continuar.',
    'authentication.configuration.invalid':
      'Não foi possível validar a credencial de acesso.',
    'identity.organization_access.forbidden':
      'Você não possui acesso a esta organização.',
    'identity.user_provisioning.external_identity_assertion_required':
      'A identidade externa verificada é obrigatória.',
    'identity.external_identity.empty': 'Informe o valor da identidade externa.',
    'identity.external_identity.invalid_type': 'O valor da identidade externa deve ser um texto.',
    'identity.external_identity.too_long':
      'O valor da identidade externa deve ter no máximo {maxLength} caracteres.',
  }),
  'en-US': Object.freeze({
    'authentication.bootstrap_assertion.expired':
      'The provisioning credential expired. Sign in again to continue.',
    'authentication.bootstrap_assertion.invalid': 'The provisioning credential is invalid.',
    'authentication.access_token.expired': 'Your session expired. Sign in again to continue.',
    'authentication.access_token.invalid': 'The access credential is invalid.',
    'authentication.access_token.missing': 'Sign in to continue.',
    'authentication.configuration.invalid': 'The access credential could not be verified.',
    'identity.organization_access.forbidden': 'You do not have access to this organization.',
    'identity.user_provisioning.external_identity_assertion_required':
      'A verified external identity is required.',
    'identity.external_identity.empty': 'Provide the external identity value.',
    'identity.external_identity.invalid_type': 'The external identity value must be text.',
    'identity.external_identity.too_long':
      'The external identity value must have at most {maxLength} characters.',
  }),
});

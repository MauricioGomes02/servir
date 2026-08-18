import type { MessageCatalog } from '@/shared/presentation/localization';

export const organizationMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    'organization.name.invalid_type': 'O nome da organizacao deve ser um texto.',
    'organization.name.empty': 'Informe o nome da organizacao.',
    'organization.name.too_long':
      'O nome da organizacao deve ter no maximo {maxLength} caracteres.',
    'organization.details.not_found': 'Organizacao nao encontrada.',
    'organization.accessible_list.authenticated_actor_required':
      'Entre na sua conta para consultar suas organizacoes.',
  }),
  'en-US': Object.freeze({
    'organization.name.invalid_type': 'The organization name must be text.',
    'organization.name.empty': 'Enter the organization name.',
    'organization.name.too_long': 'The organization name must have at most {maxLength} characters.',
    'organization.details.not_found': 'Organization not found.',
    'organization.accessible_list.authenticated_actor_required':
      'Sign in to view your organizations.',
  }),
});

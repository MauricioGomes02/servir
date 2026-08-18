import type { MessageCatalog } from '@/shared/presentation/localization';

export const organizationMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    'organization.name.invalid_type': 'O nome da igreja deve ser um texto.',
    'organization.name.empty': 'Informe o nome da igreja.',
    'organization.name.too_long': 'O nome da igreja deve ter no maximo {maxLength} caracteres.',
    'organization.details.not_found': 'Igreja nao encontrada.',
    'organization.accessible_list.authenticated_actor_required':
      'Entre na sua conta para consultar suas igrejas.',
  }),
  'en-US': Object.freeze({
    'organization.name.invalid_type': 'The church name must be text.',
    'organization.name.empty': 'Enter the church name.',
    'organization.name.too_long': 'The church name must have at most {maxLength} characters.',
    'organization.details.not_found': 'Church not found.',
    'organization.accessible_list.authenticated_actor_required': 'Sign in to view your churches.',
  }),
});

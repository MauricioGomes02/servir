import type { MessageCatalog } from '@/shared/presentation/localization';

export const membershipMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    'organization.id.invalid_type': 'O identificador da organização deve ser um texto.',
    'organization.id.empty': 'Informe o identificador da organização.',
    'organization.id.too_long': 'O identificador da organização deve ter no máximo {maxLength} caracteres.',
    'organization.id.invalid_format': 'O identificador da organização é inválido.',
    'member.name.invalid_type': 'O nome do membro deve ser um texto.',
    'member.name.empty': 'Informe o nome do membro.',
    'member.name.too_long': 'O nome do membro deve ter no máximo {maxLength} caracteres.',
    'member.registration.organization_not_found': 'A organização informada não foi encontrada.',
  }),
  'en-US': Object.freeze({
    'organization.id.invalid_type': 'The organization identifier must be text.',
    'organization.id.empty': 'Enter the organization identifier.',
    'organization.id.too_long': 'The organization identifier must have at most {maxLength} characters.',
    'organization.id.invalid_format': 'The organization identifier is invalid.',
    'member.name.invalid_type': 'The member name must be text.',
    'member.name.empty': 'Enter the member name.',
    'member.name.too_long': 'The member name must have at most {maxLength} characters.',
    'member.registration.organization_not_found': 'The specified organization was not found.',
  }),
});

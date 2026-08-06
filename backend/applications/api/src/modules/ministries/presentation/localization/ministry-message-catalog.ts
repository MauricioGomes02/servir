import type { MessageCatalog } from '@/shared/presentation/localization';

export const ministryMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    'ministry.name.invalid_type': 'O nome do ministério deve ser um texto.',
    'ministry.name.empty': 'Informe o nome do ministério.',
    'ministry.name.too_long': 'O nome do ministério deve ter no máximo {maxLength} caracteres.',
    'ministry.creation.organization_not_found': 'A organização informada não foi encontrada.',
    'ministry.creation.active_name_already_exists': 'Já existe um ministério ativo com este nome na organização.',
  }),
  'en-US': Object.freeze({
    'ministry.name.invalid_type': 'The ministry name must be text.',
    'ministry.name.empty': 'Enter the ministry name.',
    'ministry.name.too_long': 'The ministry name must have at most {maxLength} characters.',
    'ministry.creation.organization_not_found': 'The specified organization was not found.',
    'ministry.creation.active_name_already_exists': 'An active ministry with this name already exists in the organization.',
  }),
});

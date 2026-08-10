import type { MessageCatalog } from '@/shared/presentation/localization';

export const ministryMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    'ministry.name.invalid_type': 'O nome do ministério deve ser um texto.',
    'ministry.name.empty': 'Informe o nome do ministério.',
    'ministry.name.too_long': 'O nome do ministério deve ter no máximo {maxLength} caracteres.',
    'ministry.creation.organization_not_found': 'A organização informada não foi encontrada.',
    'ministry.creation.active_name_already_exists':
      'Já existe um ministério ativo com este nome na organização.',
    'ministry_role.name.invalid_type': 'O nome da função ministerial deve ser um texto.',
    'ministry_role.name.empty': 'Informe o nome da função ministerial.',
    'ministry_role.name.too_long':
      'O nome da função ministerial deve ter no máximo {maxLength} caracteres.',
    'ministry_role.definition.ministry_not_found':
      'O ministério informado não foi encontrado nesta organização.',
    'ministry_role.definition.active_name_already_exists':
      'Já existe uma função ministerial ativa com este nome.',
    'ministry_membership.request.member_not_found':
      'O membro informado não foi encontrado nesta organização.',
    'ministry_membership.request.ministry_not_found':
      'O ministério informado não foi encontrado nesta organização.',
    'ministry_membership.request.current_membership_already_exists':
      'Já existe um vínculo ministerial vigente para este membro.',
    'ministry_membership.approval.membership_not_found':
      'O vínculo ministerial informado não foi encontrado.',
    'ministry_membership.approval.not_requested':
      'Somente um vínculo solicitado pode ser aprovado.',
    'ministry_role_qualification.membership_not_found':
      'O vínculo ministerial informado não foi encontrado.',
    'ministry_role_qualification.membership_not_active':
      'Somente um vínculo ativo pode receber qualificações.',
    'ministry_role_qualification.role_not_active':
      'A função ministerial informada não existe ou não está ativa.',
    'ministry_role_qualification.active_qualification_already_exists':
      'Já existe uma qualificação ativa para esta função.',
    'ministry_team.name.invalid_type': 'O nome do time deve ser um texto.',
    'ministry_team.name.empty': 'Informe o nome do time.',
    'ministry_team.name.too_long': 'O nome do time deve ter no máximo {maxLength} caracteres.',
    'ministry_team.creation.ministry_not_found':
      'O ministério informado não foi encontrado ou não está ativo.',
    'ministry_team.creation.active_name_already_exists':
      'Já existe um time ativo com este nome no ministério.',
  }),
  'en-US': Object.freeze({
    'ministry.name.invalid_type': 'The ministry name must be text.',
    'ministry.name.empty': 'Enter the ministry name.',
    'ministry.name.too_long': 'The ministry name must have at most {maxLength} characters.',
    'ministry.creation.organization_not_found': 'The specified organization was not found.',
    'ministry.creation.active_name_already_exists':
      'An active ministry with this name already exists in the organization.',
    'ministry_role.name.invalid_type': 'The ministry role name must be text.',
    'ministry_role.name.empty': 'Enter the ministry role name.',
    'ministry_role.name.too_long':
      'The ministry role name must have at most {maxLength} characters.',
    'ministry_role.definition.ministry_not_found':
      'The specified ministry was not found in this organization.',
    'ministry_role.definition.active_name_already_exists':
      'An active ministry role with this name already exists.',
    'ministry_membership.request.member_not_found':
      'The specified member was not found in this organization.',
    'ministry_membership.request.ministry_not_found':
      'The specified ministry was not found in this organization.',
    'ministry_membership.request.current_membership_already_exists':
      'A current ministry membership already exists for this member.',
    'ministry_membership.approval.membership_not_found':
      'The specified ministry membership was not found.',
    'ministry_membership.approval.not_requested':
      'Only a requested ministry membership can be approved.',
    'ministry_role_qualification.membership_not_found':
      'The specified ministry membership was not found.',
    'ministry_role_qualification.membership_not_active':
      'Only an active membership can receive qualifications.',
    'ministry_role_qualification.role_not_active':
      'The specified ministry role does not exist or is not active.',
    'ministry_role_qualification.active_qualification_already_exists':
      'An active qualification for this role already exists.',
    'ministry_team.name.invalid_type': 'The team name must be text.',
    'ministry_team.name.empty': 'Enter the team name.',
    'ministry_team.name.too_long': 'The team name must have at most {maxLength} characters.',
    'ministry_team.creation.ministry_not_found':
      'The specified ministry was not found or is inactive.',
    'ministry_team.creation.active_name_already_exists':
      'An active team with this name already exists in the ministry.',
  }),
});

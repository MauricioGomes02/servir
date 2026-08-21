import type { MessageCatalog } from '@/shared/presentation';

export {
  AcceptMemberAccessInvitationPresenter,
  InviteMemberToAccessPresenter,
} from './member-access-invitation-presenters';
export type {
  AcceptMemberAccessInvitationView,
  InviteMemberToAccessView,
  MemberAccessInvitationFailureView,
} from './member-access-invitation-presenters';

export const identityMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    'authentication.bootstrap_assertion.expired':
      'A credencial de provisionamento expirou. Entre novamente para continuar.',
    'authentication.bootstrap_assertion.invalid': 'A credencial de provisionamento não é válida.',
    'authentication.access_token.expired': 'Sua sessão expirou. Entre novamente para continuar.',
    'authentication.access_token.invalid': 'A credencial de acesso não é válida.',
    'authentication.access_token.missing': 'Entre na sua conta para continuar.',
    'authentication.configuration.invalid': 'Não foi possível validar a credencial de acesso.',
    'identity.organization_access.forbidden': 'Você não possui acesso a esta organização.',
    'identity.user_provisioning.external_identity_assertion_required':
      'A identidade externa verificada é obrigatória.',
    'identity.member_access_invitation.authenticated_actor_required':
      'Entre na sua conta para continuar.',
    'identity.member_access_invitation.forbidden':
      'Você não possui acesso para convidar este membro.',
    'identity.member_access_invitation.member_already_linked':
      'Este membro já está vinculado a outra conta.',
    'identity.member_access_invitation.member_unavailable':
      'O membro informado não está disponível nesta organização.',
    'identity.member_access_invitation.not_found': 'O convite informado não foi encontrado.',
    'identity.member_access_invitation.expired': 'Este convite expirou.',
    'identity.member_access_invitation.already_consumed': 'Este convite já foi utilizado.',
    'identity.member_access_invitation.revoked': 'Este convite foi revogado.',
    'identity.organization_access.inactive': 'Este acesso à organização não está ativo.',
    'identity.organization_access.member_different_organization':
      'O membro não pertence à organização deste acesso.',
    'identity.organization_access.user_already_linked_to_another_member':
      'Sua conta já está vinculada a outro membro nesta organização.',
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
    'identity.member_access_invitation.authenticated_actor_required': 'Sign in to continue.',
    'identity.member_access_invitation.forbidden': 'You do not have access to invite this member.',
    'identity.member_access_invitation.member_already_linked':
      'This member is already linked to another account.',
    'identity.member_access_invitation.member_unavailable':
      'The specified member is unavailable in this organization.',
    'identity.member_access_invitation.not_found': 'The invitation was not found.',
    'identity.member_access_invitation.expired': 'This invitation expired.',
    'identity.member_access_invitation.already_consumed': 'This invitation has already been used.',
    'identity.member_access_invitation.revoked': 'This invitation was revoked.',
    'identity.organization_access.inactive': 'This organization access is not active.',
    'identity.organization_access.member_different_organization':
      'The member does not belong to this access organization.',
    'identity.organization_access.user_already_linked_to_another_member':
      'Your account is already linked to another member in this organization.',
    'identity.external_identity.empty': 'Provide the external identity value.',
    'identity.external_identity.invalid_type': 'The external identity value must be text.',
    'identity.external_identity.too_long':
      'The external identity value must have at most {maxLength} characters.',
  }),
});

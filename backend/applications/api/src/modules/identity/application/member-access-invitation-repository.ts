import type { MemberAccessInvitation, MemberAccessInvitationId } from '../domain';

export interface MemberAccessInvitationRepository {
  add(invitation: MemberAccessInvitation): Promise<void>;
  findById(invitationId: MemberAccessInvitationId): Promise<MemberAccessInvitation | null>;
  save(invitation: MemberAccessInvitation): Promise<void>;
}

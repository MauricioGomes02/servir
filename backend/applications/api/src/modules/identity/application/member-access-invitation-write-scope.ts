import type { EventOutbox } from '@/shared/application/messaging';
import type { MemberAccessInvitationAcceptanceLock } from './member-access-invitation-acceptance-lock';
import type { MemberAccessInvitationRepository } from './member-access-invitation-repository';
import type { MemberAccessLinkingFactsReader } from './member-access-linking-facts-reader';
import type { OrganizationAccessRepository } from './organization-access-repository';

export interface MemberAccessInvitationWriteScope {
  readonly acceptanceLock: MemberAccessInvitationAcceptanceLock;
  readonly linkingFacts: MemberAccessLinkingFactsReader;
  readonly invitations: MemberAccessInvitationRepository;
  readonly organizationAccesses: OrganizationAccessRepository;
  readonly outbox: EventOutbox;
}

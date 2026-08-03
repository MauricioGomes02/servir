import type { EventOutbox } from '@/shared/application/messaging';

import type { MemberRepository } from './member-repository';

export interface MemberWriteScope {
  readonly members: MemberRepository;
  readonly outbox: EventOutbox;
}

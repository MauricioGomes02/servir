import type { EventOutbox } from '@/shared/application/messaging';

import type { MemberRepository } from './repositories';

export interface MemberWriteScope {
  readonly members: MemberRepository;
  readonly outbox: EventOutbox;
}

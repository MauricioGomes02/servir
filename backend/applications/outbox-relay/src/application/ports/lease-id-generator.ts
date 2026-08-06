import type { IdGenerator } from '@servir/application-foundation';

import type { LeaseId } from '@/application/lease-id';

export type LeaseIdGenerator = IdGenerator<LeaseId>;

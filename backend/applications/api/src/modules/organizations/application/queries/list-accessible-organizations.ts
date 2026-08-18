import { UserId } from '@/modules/identity/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import { defineMessage } from '@/shared/application/mediator';
import { failure, success, type Result } from '@/shared/core/result';

export interface AccessibleOrganizationListItem {
  readonly id: OrganizationId;
  readonly name: string;
}

export interface AccessibleOrganizationListReader {
  listByUserId(userId: UserId): Promise<readonly AccessibleOrganizationListItem[]>;
}

export interface ListAccessibleOrganizationsError {
  readonly code: 'organization.accessible_list.authenticated_actor_required';
}

export class ListAccessibleOrganizationsHandler {
  constructor(private readonly reader: AccessibleOrganizationListReader) {}

  async handle(
    _query: Readonly<Record<string, never>>,
    context: ExecutionContext,
  ): Promise<Result<readonly AccessibleOrganizationListItem[], ListAccessibleOrganizationsError>> {
    const userId = UserId.create(context.actor?.userId);
    if (!userId.success)
      return failure({ code: 'organization.accessible_list.authenticated_actor_required' });
    return success(await this.reader.listByUserId(userId.value));
  }
}

export const ListAccessibleOrganizationsMessage = defineMessage<
  Readonly<Record<string, never>>,
  Awaited<ReturnType<ListAccessibleOrganizationsHandler['handle']>>
>('organizations.list-accessible-organizations', 'ListAccessibleOrganizations');

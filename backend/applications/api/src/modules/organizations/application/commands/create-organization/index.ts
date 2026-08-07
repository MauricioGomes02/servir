import { defineMessage } from '@/shared/application/mediator';
import type { CreateOrganizationCommand } from './create-organization-command';
import type { CreateOrganizationHandler } from './create-organization-handler';

export const CreateOrganizationMessage = defineMessage<
  CreateOrganizationCommand,
  Awaited<ReturnType<CreateOrganizationHandler['handle']>>
>('organizations.create-organization', 'CreateOrganization');

export { CreateOrganizationHandler } from './create-organization-handler';

export type { CreateOrganizationCommand } from './create-organization-command';

export type {
  CreateOrganizationDependencies,
  CreateOrganizationOutput,
} from './create-organization-handler';

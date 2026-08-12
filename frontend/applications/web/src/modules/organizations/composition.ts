import { CreateOrganizationService } from './application/create-organization-service';
import { GetOrganizationDetailsService } from './application/get-organization-details-service';
import { organizationGateway } from './infrastructure/http-organization-gateway';

export const createOrganization = new CreateOrganizationService(organizationGateway);
export const getOrganizationDetails = new GetOrganizationDetailsService(organizationGateway);

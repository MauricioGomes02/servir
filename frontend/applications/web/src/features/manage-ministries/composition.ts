import { ministryGateway } from './http-ministry-gateway';
import { ManageMinistries } from './manage-ministries';

export const manageMinistries = new ManageMinistries(ministryGateway);

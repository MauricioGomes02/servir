import type { User } from '../domain';

export interface UserProvisioningResult {
  readonly created: boolean;
  readonly user: User;
}

export interface UserProvisioner {
  provision(candidate: User): Promise<UserProvisioningResult>;
}

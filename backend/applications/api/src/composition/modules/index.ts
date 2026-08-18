import type { ApplicationModule } from './application-module';
import { activitiesModule } from './register-activities-module';
import { availabilityModule } from './register-availability-module';
import { membershipModule } from './register-membership-module';
import { ministriesModule } from './register-ministries-module';
import { organizationsModule } from './register-organizations-module';
import { identityModule } from './register-identity-module';

export const applicationModules: readonly ApplicationModule[] = Object.freeze([
  identityModule,
  organizationsModule,
  membershipModule,
  ministriesModule,
  activitiesModule,
  availabilityModule,
]);

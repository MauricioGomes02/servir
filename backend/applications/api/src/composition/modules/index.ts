import type { ApplicationModule } from './application-module';
import { activitiesModule } from './register-activities-module';
import { membershipModule } from './register-membership-module';
import { ministriesModule } from './register-ministries-module';
import { organizationsModule } from './register-organizations-module';

export const applicationModules: readonly ApplicationModule[] = Object.freeze([
  organizationsModule,
  membershipModule,
  ministriesModule,
  activitiesModule,
]);

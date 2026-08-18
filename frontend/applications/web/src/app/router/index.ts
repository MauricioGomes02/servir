import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/sign-in',
      name: 'sign-in',
      component: () => import('@/pages/sign-in').then((module) => module.SignInPage),
    },
    {
      path: '/',
      name: 'accessible-organizations',
      component: () =>
        import('@/pages/accessible-organizations').then(
          (module) => module.AccessibleOrganizationsPage,
        ),
    },
    {
      path: '/organizations/new',
      name: 'create-organization',
      component: () =>
        import('@/pages/create-organization').then((module) => module.CreateOrganizationPage),
    },
    {
      path: '/organizations/:organizationId',
      component: () =>
        import('@/pages/organization-layout').then((module) => module.OrganizationLayout),
      props: true,
      children: [
        {
          path: '',
          name: 'organization-home',
          meta: { navigationArea: 'home' },
          component: () =>
            import('@/pages/organization-home').then((module) => module.OrganizationHomePage),
          props: true,
        },
        {
          path: 'ministries',
          name: 'organization-ministries',
          meta: { navigationArea: 'ministries' },
          component: () => import('@/pages/ministries').then((module) => module.MinistriesPage),
          props: true,
        },
        {
          path: 'ministries/:ministryId',
          name: 'ministry-details',
          meta: { navigationArea: 'ministries' },
          component: () =>
            import('@/pages/ministry-details').then((module) => module.MinistryDetailsPage),
          props: true,
        },
        {
          path: 'members',
          name: 'organization-members',
          meta: { navigationArea: 'members' },
          component: () => import('@/pages/members').then((module) => module.MembersPage),
          props: true,
        },
        {
          path: 'members/:memberId',
          name: 'member-details',
          meta: { navigationArea: 'members' },
          component: () =>
            import('@/pages/member-details').then((module) => module.MemberDetailsPage),
          props: true,
        },
        {
          path: 'activities',
          name: 'organization-activities',
          meta: { navigationArea: 'activities' },
          component: () => import('@/pages/activities').then((module) => module.ActivitiesPage),
          props: true,
        },
        {
          path: 'activities/:activityId',
          name: 'activity-details',
          meta: { navigationArea: 'activities' },
          component: () =>
            import('@/pages/activity-details').then((module) => module.ActivityDetailsPage),
          props: true,
        },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

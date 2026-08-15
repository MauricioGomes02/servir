import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: { name: 'create-organization' } },
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
          component: () =>
            import('@/pages/organization-home').then((module) => module.OrganizationHomePage),
          props: true,
        },
        {
          path: 'ministries',
          name: 'organization-ministries',
          component: () => import('@/pages/ministries').then((module) => module.MinistriesPage),
          props: true,
        },
        {
          path: 'ministries/:ministryId',
          name: 'ministry-details',
          component: () =>
            import('@/pages/ministry-details').then((module) => module.MinistryDetailsPage),
          props: true,
        },
        {
          path: 'members',
          name: 'organization-members',
          component: () => import('@/pages/members').then((module) => module.MembersPage),
          props: true,
        },
        {
          path: 'members/:memberId',
          name: 'member-details',
          component: () =>
            import('@/pages/member-details').then((module) => module.MemberDetailsPage),
          props: true,
        },
        {
          path: 'activities',
          name: 'organization-activities',
          component: () => import('@/pages/activities').then((module) => module.ActivitiesPage),
          props: true,
        },
        {
          path: 'activities/:activityId',
          name: 'activity-details',
          component: () =>
            import('@/pages/activity-details').then((module) => module.ActivityDetailsPage),
          props: true,
        },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

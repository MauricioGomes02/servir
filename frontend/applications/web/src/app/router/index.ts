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
          component: () => import('@/features/manage-ministries/MinistriesView.vue'),
          props: true,
        },
        {
          path: 'ministries/:ministryId',
          name: 'ministry-details',
          component: () => import('@/features/manage-ministries/MinistryDetailsView.vue'),
          props: true,
        },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

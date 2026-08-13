import type { RouteRecordRaw } from 'vue-router';

export const organizationRoutes: readonly RouteRecordRaw[] = [
  {
    path: '/organizations/new',
    name: 'create-organization',
    component: () => import('./views/CreateOrganizationView.vue'),
  },
  {
    path: '/organizations/:organizationId',
    component: () => import('./views/OrganizationShell.vue'),
    props: true,
    children: [
      {
        path: '',
        name: 'organization-home',
        component: () => import('./views/OrganizationWorkspaceView.vue'),
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
];

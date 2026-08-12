import type { RouteRecordRaw } from 'vue-router';

export const organizationRoutes: readonly RouteRecordRaw[] = [
  {
    path: '/organizations/new',
    name: 'create-organization',
    component: () => import('./views/CreateOrganizationView.vue'),
  },
  {
    path: '/organizations/:organizationId',
    name: 'organization-workspace',
    component: () => import('./views/OrganizationWorkspaceView.vue'),
    props: true,
  },
];

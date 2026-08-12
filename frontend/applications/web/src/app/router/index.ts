import { createRouter, createWebHistory } from 'vue-router';
import { organizationRoutes } from '@/modules/organizations/presentation/routes';

export const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', redirect: { name: 'create-organization' } }, ...organizationRoutes],
  scrollBehavior: () => ({ top: 0 }),
});

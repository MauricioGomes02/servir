import { computed } from 'vue';
import { useRoute } from 'vue-router';

export function useAppNavigation() {
  const route = useRoute();
  const brandCanNavigate = computed(
    () => typeof route.params.organizationId === 'string' && route.name !== 'organization-home',
  );
  const homeRoute = computed(() => {
    const organizationId = route.params.organizationId;
    return typeof organizationId === 'string'
      ? { name: 'organization-home', params: { organizationId } }
      : { name: 'create-organization' };
  });

  return { brandCanNavigate, homeRoute };
}

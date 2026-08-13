import { computed } from 'vue';
import { useRoute } from 'vue-router';

export function useAppNavigation() {
  const route = useRoute();
  const homeRoute = computed(() => {
    const organizationId = route.params.organizationId;
    return typeof organizationId === 'string'
      ? { name: 'organization-home', params: { organizationId } }
      : { name: 'create-organization' };
  });

  return { homeRoute };
}

import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { listAccessibleOrganizations, type Organization } from '@/entities/organization';
import { HttpProblem } from '@/shared/api';

export function useAccessibleOrganizationsPage() {
  const router = useRouter();
  const organizations = ref<readonly Organization[]>([]);
  const loading = ref(true);
  const problem = ref<HttpProblem>();
  const abortController = new AbortController();

  async function load(): Promise<void> {
    loading.value = true;
    problem.value = undefined;
    try {
      const result = await listAccessibleOrganizations(abortController.signal);
      organizations.value = result.items;
      if (result.items.length === 1) {
        await router.replace({
          name: 'organization-home',
          params: { organizationId: result.items[0]!.id },
        });
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        problem.value =
          error instanceof HttpProblem
            ? error
            : new HttpProblem({
                type: 'about:blank',
                title: 'Não foi possível carregar suas igrejas.',
                status: 0,
              });
      }
    } finally {
      if (!abortController.signal.aborted) loading.value = false;
    }
  }

  onMounted(load);
  onBeforeUnmount(() => abortController.abort());

  return { load, loading, organizations, problem };
}

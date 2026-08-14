import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { getOrganization, type Organization } from '@/entities/organization';
import { HttpProblem } from '@/shared/api';

export function useOrganizationLayout(organizationId: Ref<string>) {
  const organization = ref<Organization>();
  const problem = ref<HttpProblem>();
  const loading = ref(true);
  let abortController: AbortController | undefined;

  async function load(): Promise<void> {
    abortController?.abort();
    abortController = new AbortController();
    loading.value = true;
    problem.value = undefined;
    try {
      organization.value = await getOrganization(organizationId.value, abortController.signal);
    } catch (error) {
      if (!abortController.signal.aborted) {
        problem.value =
          error instanceof HttpProblem
            ? error
            : new HttpProblem({
                type: 'about:blank',
                title: 'Não foi possível carregar a organização.',
                status: 0,
              });
      }
    } finally {
      if (!abortController.signal.aborted) loading.value = false;
    }
  }

  onMounted(load);
  onBeforeUnmount(() => abortController?.abort());

  return { load, loading, organization, problem };
}

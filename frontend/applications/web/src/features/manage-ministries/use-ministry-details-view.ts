import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { HttpProblem } from '@/shared/http/problem-details';
import { manageMinistries } from './composition';
import type { MinistryDetails } from './ministry';

export function useMinistryDetailsView(organizationId: Ref<string>, ministryId: Ref<string>) {
  const ministry = ref<MinistryDetails>();
  const loading = ref(true);
  const problem = ref<HttpProblem>();
  let requestController: AbortController | undefined;

  async function load(): Promise<void> {
    requestController?.abort();
    requestController = new AbortController();
    loading.value = true;
    problem.value = undefined;
    try {
      ministry.value = await manageMinistries.get(
        organizationId.value,
        ministryId.value,
        requestController.signal,
      );
    } catch (error) {
      if (!requestController.signal.aborted)
        problem.value =
          error instanceof HttpProblem
            ? error
            : new HttpProblem({
                type: 'about:blank',
                title: 'Não foi possível carregar o ministério.',
                status: 0,
              });
    } finally {
      if (!requestController.signal.aborted) loading.value = false;
    }
  }

  onMounted(load);
  onBeforeUnmount(() => requestController?.abort());

  return { load, loading, ministry, problem };
}

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { listMinistries, type MinistryPage } from '@/entities/ministry';
import { useCreateMinistry } from '@/features/create-ministry';
import { HttpProblem } from '@/shared/api';

export function useMinistriesPage(organizationId: Ref<string>) {
  const page = ref<MinistryPage>();
  const loading = ref(true);
  const problem = ref<HttpProblem>();
  const search = ref('');
  const appliedSearch = ref('');
  const showCreation = ref(false);
  let requestController: AbortController | undefined;

  async function load(): Promise<void> {
    requestController?.abort();
    requestController = new AbortController();
    loading.value = true;
    problem.value = undefined;
    try {
      page.value = await listMinistries(
        organizationId.value,
        { search: appliedSearch.value || undefined, status: 'active', pageSize: 20 },
        requestController.signal,
      );
    } catch (error) {
      if (!requestController.signal.aborted) {
        problem.value =
          error instanceof HttpProblem
            ? error
            : new HttpProblem({
                type: 'about:blank',
                title: 'Não foi possível carregar os ministérios.',
                status: 0,
              });
      }
    } finally {
      if (!requestController.signal.aborted) loading.value = false;
    }
  }

  async function applySearch(): Promise<void> {
    appliedSearch.value = search.value.trim();
    await load();
  }

  async function clearSearch(): Promise<void> {
    search.value = '';
    appliedSearch.value = '';
    await load();
  }

  const {
    create,
    creating,
    name,
    nameErrors,
    problem: creationProblem,
  } = useCreateMinistry(organizationId, async () => {
    showCreation.value = false;
    await load();
  });

  onMounted(load);
  onBeforeUnmount(() => requestController?.abort());

  return {
    appliedSearch,
    applySearch,
    clearSearch,
    createMinistry: create,
    creating,
    creationProblem,
    load,
    loading,
    name,
    nameErrors,
    page,
    problem,
    search,
    showCreation,
  };
}

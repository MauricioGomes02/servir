import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { fieldErrors, HttpProblem } from '@/shared/api';
import { manageMinistries } from './composition';
import type { MinistryPage } from './ministry';

export function useMinistriesView(organizationId: Ref<string>) {
  const page = ref<MinistryPage>();
  const loading = ref(true);
  const problem = ref<HttpProblem>();
  const search = ref('');
  const appliedSearch = ref('');
  const showCreation = ref(false);
  const name = ref('');
  const creating = ref(false);
  const creationProblem = ref<HttpProblem>();
  let requestController: AbortController | undefined;

  const nameErrors = computed(() =>
    creationProblem.value ? fieldErrors(creationProblem.value.problem, 'name') : [],
  );

  async function load(): Promise<void> {
    requestController?.abort();
    requestController = new AbortController();
    loading.value = true;
    problem.value = undefined;
    try {
      page.value = await manageMinistries.list(
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

  async function createMinistry(): Promise<void> {
    creationProblem.value = undefined;
    creating.value = true;
    try {
      await manageMinistries.create(organizationId.value, name.value);
      name.value = '';
      showCreation.value = false;
      await load();
    } catch (error) {
      creationProblem.value =
        error instanceof HttpProblem
          ? error
          : new HttpProblem({
              type: 'about:blank',
              title: 'Não foi possível criar o ministério.',
              status: 0,
            });
    } finally {
      creating.value = false;
    }
  }

  onMounted(load);
  onBeforeUnmount(() => requestController?.abort());

  return {
    appliedSearch,
    applySearch,
    clearSearch,
    createMinistry,
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

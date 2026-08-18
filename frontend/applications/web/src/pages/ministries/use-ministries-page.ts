import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listMinistries, type MinistryPage } from '@/entities/ministry';
import { useCreateMinistry } from '@/features/create-ministry';
import { HttpProblem } from '@/shared/api';
import { useLocalizedMessages } from '@/shared/i18n';
import { ministriesMessages } from './ministries.messages';

export function useMinistriesPage(organizationId: Ref<string>) {
  const { t } = useLocalizedMessages(ministriesMessages);
  const route = useRoute();
  const router = useRouter();
  const initialSearch = typeof route.query.search === 'string' ? route.query.search.trim() : '';
  const page = ref<MinistryPage>();
  const loading = ref(true);
  const problem = ref<HttpProblem>();
  const search = ref(initialSearch);
  const appliedSearch = ref(initialSearch);
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
                title: t('fallbackError'),
                status: 0,
              });
      }
    } finally {
      if (!requestController.signal.aborted) loading.value = false;
    }
  }

  async function applySearch(): Promise<void> {
    const normalized = search.value.trim();
    if (normalized === appliedSearch.value) {
      await load();
      return;
    }
    await router.push({
      query: { ...route.query, search: normalized || undefined, page: undefined },
    });
  }

  async function clearSearch(): Promise<void> {
    search.value = '';
    await applySearch();
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
  watch(
    () => route.query.search,
    async (value) => {
      const normalized = typeof value === 'string' ? value.trim() : '';
      if (normalized === appliedSearch.value) return;
      search.value = normalized;
      appliedSearch.value = normalized;
      await load();
    },
  );
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

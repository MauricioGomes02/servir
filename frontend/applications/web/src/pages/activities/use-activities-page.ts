import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { listActivities, type ActivityPage } from '@/entities/activity';
import { listMinistries, type MinistrySummary } from '@/entities/ministry';
import { useCreateActivity } from '@/features/create-activity';
import { HttpProblem } from '@/shared/api';
import { useLocalizedMessages } from '@/shared/i18n';
import { activitiesMessages } from './activities.messages';
import { useRoute, useRouter } from 'vue-router';

function pageNumber(value: unknown): number {
  if (typeof value !== 'string') return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function useActivitiesPage(organizationId: Ref<string>) {
  const { t } = useLocalizedMessages(activitiesMessages);
  const route = useRoute();
  const router = useRouter();
  const initialSearch = typeof route.query.search === 'string' ? route.query.search.trim() : '';
  const activities = ref<ActivityPage>();
  const ministries = ref<readonly MinistrySummary[]>([]);
  const loading = ref(true);
  const problem = ref<HttpProblem>();
  const search = ref(initialSearch);
  const appliedSearch = ref(initialSearch);
  const requestedPage = ref(pageNumber(route.query.page));
  const creationOpen = ref(false);
  let requestController: AbortController | undefined;

  async function load(): Promise<void> {
    requestController?.abort();
    requestController = new AbortController();
    loading.value = true;
    problem.value = undefined;
    try {
      const [activityPage, ministryPage] = await Promise.all([
        listActivities(
          organizationId.value,
          {
            page: requestedPage.value,
            pageSize: 20,
            search: appliedSearch.value || undefined,
            status: 'active',
          },
          requestController.signal,
        ),
        listMinistries(
          organizationId.value,
          { page: 1, pageSize: 100, status: 'active' },
          requestController.signal,
        ),
      ]);
      activities.value = activityPage;
      ministries.value = ministryPage.items;
    } catch (error) {
      if (!requestController.signal.aborted)
        problem.value =
          error instanceof HttpProblem
            ? error
            : new HttpProblem({
                type: 'about:blank',
                title: t('fallbackError'),
                status: 0,
              });
    } finally {
      if (!requestController.signal.aborted) loading.value = false;
    }
  }

  async function applySearch(): Promise<void> {
    const normalized = search.value.trim();
    if (normalized === appliedSearch.value && requestedPage.value === 1) return load();
    await router.push({ query: { search: normalized || undefined } });
  }

  async function clearSearch(): Promise<void> {
    search.value = '';
    await applySearch();
  }

  async function goToPage(page: number): Promise<void> {
    if (page < 1 || page === requestedPage.value) return;
    await router.push({
      query: {
        search: appliedSearch.value || undefined,
        page: page === 1 ? undefined : String(page),
      },
    });
  }

  const creation = useCreateActivity(organizationId, async (activityId) => {
    await router.push({
      name: 'activity-details',
      params: { organizationId: organizationId.value, activityId },
    });
  });

  onMounted(load);
  watch(
    () => [route.query.search, route.query.page] as const,
    async ([searchValue, pageValue]) => {
      const normalized = typeof searchValue === 'string' ? searchValue.trim() : '';
      const nextPage = pageNumber(pageValue);
      if (normalized === appliedSearch.value && nextPage === requestedPage.value) return;
      search.value = normalized;
      appliedSearch.value = normalized;
      requestedPage.value = nextPage;
      await load();
    },
  );
  onBeforeUnmount(() => requestController?.abort());

  return {
    activities,
    appliedSearch,
    applySearch,
    clearSearch,
    creation,
    creationOpen,
    goToPage,
    load,
    loading,
    ministries,
    problem,
    search,
  };
}

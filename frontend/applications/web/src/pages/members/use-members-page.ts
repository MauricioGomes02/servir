import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listMembers, type MemberPage } from '@/entities/member';
import { useRegisterMember } from '@/features/register-member';
import { HttpProblem } from '@/shared/api';

function pageNumber(value: unknown): number {
  if (typeof value !== 'string') return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function useMembersPage(organizationId: Ref<string>) {
  const route = useRoute();
  const router = useRouter();
  const initialSearch = typeof route.query.search === 'string' ? route.query.search.trim() : '';
  const members = ref<MemberPage>();
  const loading = ref(true);
  const problem = ref<HttpProblem>();
  const search = ref(initialSearch);
  const appliedSearch = ref(initialSearch);
  const requestedPage = ref(pageNumber(route.query.page));
  const registrationOpen = ref(false);
  let requestController: AbortController | undefined;

  async function load(): Promise<void> {
    requestController?.abort();
    requestController = new AbortController();
    loading.value = true;
    problem.value = undefined;
    try {
      members.value = await listMembers(
        organizationId.value,
        {
          page: requestedPage.value,
          pageSize: 20,
          search: appliedSearch.value || undefined,
          status: 'active',
        },
        requestController.signal,
      );
    } catch (error) {
      if (!requestController.signal.aborted) {
        problem.value =
          error instanceof HttpProblem
            ? error
            : new HttpProblem({
                type: 'about:blank',
                title: 'Não foi possível carregar os membros.',
                status: 0,
              });
      }
    } finally {
      if (!requestController.signal.aborted) loading.value = false;
    }
  }

  async function applySearch(): Promise<void> {
    const normalized = search.value.trim();
    if (normalized === appliedSearch.value && requestedPage.value === 1) {
      await load();
      return;
    }
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

  const registration = useRegisterMember(organizationId, async (member) => {
    await router.push({
      name: 'member-details',
      params: { organizationId: organizationId.value, memberId: member.id },
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
    appliedSearch,
    applySearch,
    clearSearch,
    goToPage,
    load,
    loading,
    members,
    problem,
    registration,
    registrationOpen,
    search,
  };
}

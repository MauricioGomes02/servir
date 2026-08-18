import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { getMinistry, type MinistryDetails } from '@/entities/ministry';
import { useDefineMinistryRole } from '@/features/define-ministry-role';
import { HttpProblem } from '@/shared/api';
import { useLocalizedMessages } from '@/shared/i18n';
import { ministryDetailsMessages } from './ministry-details.messages';

export function useMinistryDetailsPage(organizationId: Ref<string>, ministryId: Ref<string>) {
  const { t } = useLocalizedMessages(ministryDetailsMessages);
  const ministry = ref<MinistryDetails>();
  const loading = ref(true);
  const problem = ref<HttpProblem>();
  const roleFormOpen = ref(false);
  let requestController: AbortController | undefined;

  async function fetchMinistry(indicateLoading: boolean): Promise<void> {
    requestController?.abort();
    requestController = new AbortController();
    if (indicateLoading) loading.value = true;
    problem.value = undefined;
    try {
      ministry.value = await getMinistry(
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
                title: t('fallbackError'),
                status: 0,
              });
    } finally {
      if (!requestController.signal.aborted && indicateLoading) loading.value = false;
    }
  }

  const load = (): Promise<void> => fetchMinistry(true);
  const roleDefinition = useDefineMinistryRole(organizationId, ministryId, async () => {
    await fetchMinistry(false);
    roleFormOpen.value = false;
  });

  onMounted(load);
  onBeforeUnmount(() => requestController?.abort());

  return { load, loading, ministry, problem, roleDefinition, roleFormOpen };
}

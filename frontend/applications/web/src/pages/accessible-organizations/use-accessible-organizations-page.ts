import { onBeforeUnmount, onMounted, ref } from 'vue';
import { listAccessibleOrganizations, type Organization } from '@/entities/organization';
import { HttpProblem } from '@/shared/api';
import { useLocalizedMessages } from '@/shared/i18n';
import { accessibleOrganizationsMessages } from './accessible-organizations.messages';

export function useAccessibleOrganizationsPage() {
  const { t } = useLocalizedMessages(accessibleOrganizationsMessages);
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
    } catch (error) {
      if (!abortController.signal.aborted) {
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
      if (!abortController.signal.aborted) loading.value = false;
    }
  }

  onMounted(load);
  onBeforeUnmount(() => abortController.abort());

  return { load, loading, organizations, problem };
}

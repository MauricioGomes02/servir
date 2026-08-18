import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { getActivity, type ActivityDetails } from '@/entities/activity';
import { HttpProblem } from '@/shared/api';
import { useLocalizedMessages } from '@/shared/i18n';
import { activityDetailsMessages } from './activity-details.messages';

export function useActivityDetailsPage(organizationId: Ref<string>, activityId: Ref<string>) {
  const { t } = useLocalizedMessages(activityDetailsMessages);
  const activity = ref<ActivityDetails>();
  const loading = ref(true);
  const problem = ref<HttpProblem>();
  let requestController: AbortController | undefined;

  async function load(): Promise<void> {
    requestController?.abort();
    requestController = new AbortController();
    loading.value = true;
    problem.value = undefined;
    try {
      activity.value = await getActivity(
        organizationId.value,
        activityId.value,
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
      if (!requestController.signal.aborted) loading.value = false;
    }
  }

  onMounted(load);
  watch([organizationId, activityId], load);
  onBeforeUnmount(() => requestController?.abort());
  return { activity, load, loading, problem };
}

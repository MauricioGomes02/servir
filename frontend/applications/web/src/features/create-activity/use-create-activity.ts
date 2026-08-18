import { computed, ref, type Ref } from 'vue';
import { fieldErrors, HttpProblem } from '@/shared/api';
import { createActivity } from './create-activity';
import { useLocalizedMessages } from '@/shared/i18n';
import { createActivityMessages } from './create-activity.messages';

export function useCreateActivity(
  organizationId: Ref<string>,
  afterCreated: (activityId: string) => Promise<void>,
) {
  const { t } = useLocalizedMessages(createActivityMessages);
  const name = ref('');
  const ministryIds = ref<string[]>([]);
  const creating = ref(false);
  const problem = ref<HttpProblem>();
  const nameErrors = computed(() =>
    problem.value ? fieldErrors(problem.value.problem, 'name') : [],
  );
  const ministryErrors = computed(() => {
    if (!problem.value) return [];
    return (
      problem.value.problem.errors
        ?.filter((error) => error.pointer?.startsWith('#/ministryIds'))
        .map((error) => error.detail) ?? []
    );
  });

  async function create(): Promise<void> {
    problem.value = undefined;
    creating.value = true;
    try {
      const activity = await createActivity(organizationId.value, {
        name: name.value,
        ministryIds: ministryIds.value,
      });
      await afterCreated(activity.id);
    } catch (error) {
      problem.value =
        error instanceof HttpProblem
          ? error
          : new HttpProblem({
              type: 'about:blank',
              title: t('fallbackError'),
              status: 0,
            });
    } finally {
      creating.value = false;
    }
  }

  return { create, creating, ministryErrors, ministryIds, name, nameErrors, problem };
}

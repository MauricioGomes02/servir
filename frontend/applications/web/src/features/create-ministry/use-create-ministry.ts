import { computed, ref, type Ref } from 'vue';
import { fieldErrors, HttpProblem } from '@/shared/api';
import { createMinistry } from './create-ministry';
import { useLocalizedMessages } from '@/shared/i18n';
import { createMinistryMessages } from './create-ministry.messages';

export function useCreateMinistry(organizationId: Ref<string>, afterCreated: () => Promise<void>) {
  const { t } = useLocalizedMessages(createMinistryMessages);
  const name = ref('');
  const creating = ref(false);
  const problem = ref<HttpProblem>();
  const nameErrors = computed(() =>
    problem.value ? fieldErrors(problem.value.problem, 'name') : [],
  );

  async function create(): Promise<void> {
    problem.value = undefined;
    creating.value = true;
    try {
      await createMinistry(organizationId.value, name.value);
      name.value = '';
      await afterCreated();
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

  return { create, creating, name, nameErrors, problem };
}

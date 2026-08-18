import { computed, ref, type Ref } from 'vue';
import { fieldErrors, HttpProblem } from '@/shared/api';
import { defineMinistryRole } from './define-ministry-role';
import { useLocalizedMessages } from '@/shared/i18n';
import { defineMinistryRoleMessages } from './define-ministry-role.messages';

export function useDefineMinistryRole(
  organizationId: Ref<string>,
  ministryId: Ref<string>,
  afterDefined: () => Promise<void>,
) {
  const { t } = useLocalizedMessages(defineMinistryRoleMessages);
  const name = ref('');
  const defining = ref(false);
  const problem = ref<HttpProblem>();
  const nameErrors = computed(() =>
    problem.value ? fieldErrors(problem.value.problem, 'name') : [],
  );

  async function defineRole(): Promise<void> {
    problem.value = undefined;
    defining.value = true;
    try {
      await defineMinistryRole(organizationId.value, ministryId.value, name.value);
      name.value = '';
      await afterDefined();
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
      defining.value = false;
    }
  }

  return { defineRole, defining, name, nameErrors, problem };
}

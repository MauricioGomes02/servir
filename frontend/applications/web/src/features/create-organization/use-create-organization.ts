import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fieldErrors, HttpProblem } from '@/shared/api';
import { createOrganization } from './create-organization';
import { useLocalizedMessages } from '@/shared/i18n';
import { createOrganizationMessages } from './create-organization.messages';

export function useCreateOrganization() {
  const { t } = useLocalizedMessages(createOrganizationMessages);
  const router = useRouter();
  const name = ref('');
  const submitting = ref(false);
  const problem = ref<HttpProblem>();
  const nameErrors = computed(() =>
    problem.value ? fieldErrors(problem.value.problem, 'name') : [],
  );

  async function submit(): Promise<void> {
    problem.value = undefined;
    submitting.value = true;
    try {
      const organization = await createOrganization(name.value);
      await router.push({
        name: 'organization-home',
        params: { organizationId: organization.id },
      });
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
      submitting.value = false;
    }
  }

  return { name, nameErrors, problem, submit, submitting };
}

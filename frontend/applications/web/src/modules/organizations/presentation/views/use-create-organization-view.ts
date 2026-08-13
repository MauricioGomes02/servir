import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fieldErrors, HttpProblem } from '@/shared/http/problem-details';
import { createOrganization } from '../../composition';

export function useCreateOrganizationView() {
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
      const organization = await createOrganization.execute(name.value);
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
              title: 'Não foi possível conectar à API.',
              status: 0,
            });
    } finally {
      submitting.value = false;
    }
  }

  return { name, nameErrors, problem, submit, submitting };
}

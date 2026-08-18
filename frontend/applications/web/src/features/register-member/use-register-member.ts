import { computed, ref, type Ref } from 'vue';
import { fieldErrors, HttpProblem } from '@/shared/api';
import { registerMember, type RegisteredMember } from './register-member';
import { useLocalizedMessages } from '@/shared/i18n';
import { registerMemberMessages } from './register-member.messages';

export function useRegisterMember(
  organizationId: Ref<string>,
  afterRegistered: (member: RegisteredMember) => Promise<void>,
) {
  const { t } = useLocalizedMessages(registerMemberMessages);
  const name = ref('');
  const registering = ref(false);
  const problem = ref<HttpProblem>();
  const nameErrors = computed(() =>
    problem.value ? fieldErrors(problem.value.problem, 'name') : [],
  );

  async function register(): Promise<void> {
    problem.value = undefined;
    registering.value = true;
    try {
      const member = await registerMember(organizationId.value, name.value);
      name.value = '';
      await afterRegistered(member);
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
      registering.value = false;
    }
  }

  return { name, nameErrors, problem, register, registering };
}

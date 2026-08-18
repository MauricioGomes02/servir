import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { getMember, type MemberDetails } from '@/entities/member';
import { HttpProblem } from '@/shared/api';
import { useLocalizedMessages } from '@/shared/i18n';
import { memberDetailsMessages } from './member-details.messages';

export function useMemberDetailsPage(organizationId: Ref<string>, memberId: Ref<string>) {
  const { t } = useLocalizedMessages(memberDetailsMessages);
  const member = ref<MemberDetails>();
  const loading = ref(true);
  const problem = ref<HttpProblem>();
  let requestController: AbortController | undefined;

  async function load(): Promise<void> {
    requestController?.abort();
    requestController = new AbortController();
    loading.value = true;
    problem.value = undefined;
    try {
      member.value = await getMember(
        organizationId.value,
        memberId.value,
        requestController.signal,
      );
    } catch (error) {
      if (!requestController.signal.aborted) {
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
      if (!requestController.signal.aborted) loading.value = false;
    }
  }

  onMounted(load);
  onBeforeUnmount(() => requestController?.abort());

  return { load, loading, member, problem };
}

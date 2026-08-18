<script setup lang="ts">
import { toRef } from 'vue';
import {
  AppBackLink,
  AppButton,
  AppDetailHeader,
  AppRouteState,
  AppStatusBadge,
} from '@/shared/ui';
import { useLocalizedMessages } from '@/shared/i18n';
import { memberDetailsMessages } from './member-details.messages';
import { useMemberDetailsPage } from './use-member-details-page';

const props = defineProps<{ organizationId: string; memberId: string }>();
const { load, loading, member, problem } = useMemberDetailsPage(
  toRef(props, 'organizationId'),
  toRef(props, 'memberId'),
);
const { t } = useLocalizedMessages(memberDetailsMessages);
</script>

<template>
  <AppRouteState v-if="loading" loading>
    <template #status>{{ t('loading') }}</template>
  </AppRouteState>
  <AppRouteState v-else-if="problem" title-id="member-details-error-title">
    <template #eyebrow>{{ t('cannotContinue') }}</template>
    <template #title>{{ problem.problem.title }}</template>
    <template #description>{{ t('errorDescription') }}</template>
    <template #actions>
      <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
      <RouterLink
        :to="{ name: 'organization-members', params: { organizationId } }"
        class="app-button app-button-tertiary"
      >
        {{ t('back') }}
      </RouterLink>
    </template>
  </AppRouteState>
  <article v-else-if="member" class="member-details" aria-labelledby="member-title">
    <nav class="app-back-navigation" :aria-label="t('navigation')">
      <AppBackLink :to="{ name: 'organization-members', params: { organizationId } }">
        {{ t('back') }}
      </AppBackLink>
    </nav>
    <AppDetailHeader title-id="member-title">
      <template #eyebrow>{{ t('eyebrow') }}</template>
      <template #title>{{ member.name }}</template>
      <template #description>{{ t('description') }}</template>
      <template #aside>
        <AppStatusBadge :tone="member.status === 'active' ? 'success' : 'neutral'">
          {{ member.status === 'active' ? t('active') : t('inactive') }}
        </AppStatusBadge>
      </template>
    </AppDetailHeader>
  </article>
</template>

<style src="./member-details-page.css"></style>

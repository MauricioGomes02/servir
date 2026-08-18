<script setup lang="ts">
import { toRef } from 'vue';
import {
  AppBackLink,
  AppButton,
  AppContentSection,
  AppDetailHeader,
  AppIcon,
  AppRouteState,
  AppStatusBadge,
} from '@/shared/ui';
import { useLocalizedMessages } from '@/shared/i18n';
import { activityDetailsMessages } from './activity-details.messages';
import { useActivityDetailsPage } from './use-activity-details-page';

const props = defineProps<{ organizationId: string; activityId: string }>();
const { activity, load, loading, problem } = useActivityDetailsPage(
  toRef(props, 'organizationId'),
  toRef(props, 'activityId'),
);
const { t } = useLocalizedMessages(activityDetailsMessages);
</script>

<template>
  <AppRouteState v-if="loading" loading
    ><template #status>{{ t('loading') }}</template></AppRouteState
  >
  <AppRouteState v-else-if="problem" title-id="activity-details-error-title">
    <template #eyebrow>{{ t('cannotContinue') }}</template>
    <template #title>{{ problem.problem.title }}</template>
    <template #description>{{ t('errorDescription') }}</template>
    <template #actions>
      <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
      <RouterLink
        :to="{ name: 'organization-activities', params: { organizationId } }"
        class="app-button app-button-tertiary"
        >{{ t('back') }}</RouterLink
      >
    </template>
  </AppRouteState>
  <article v-else-if="activity" class="activity-details" aria-labelledby="activity-title">
    <nav class="app-back-navigation" :aria-label="t('navigation')">
      <AppBackLink :to="{ name: 'organization-activities', params: { organizationId } }">{{
        t('back')
      }}</AppBackLink>
    </nav>
    <AppDetailHeader title-id="activity-title">
      <template #eyebrow>{{ t('eyebrow') }}</template>
      <template #title>{{ activity.name }}</template>
      <template #description>{{ t('description') }}</template>
      <template #aside
        ><AppStatusBadge :tone="activity.status === 'active' ? 'success' : 'neutral'">{{
          activity.status === 'active' ? t('active') : t('inactive')
        }}</AppStatusBadge></template
      >
    </AppDetailHeader>
    <AppContentSection title-id="activity-participants-title">
      <template #eyebrow>{{ t('participation') }}</template>
      <template #title>{{ t('ministries') }}</template>
      <ul class="activity-participants">
        <li v-for="ministry in activity.ministries" :key="ministry.id">
          <RouterLink
            :to="{ name: 'ministry-details', params: { organizationId, ministryId: ministry.id } }"
            >{{ ministry.name }} <AppIcon name="arrow"
          /></RouterLink>
        </li>
      </ul>
    </AppContentSection>
  </article>
</template>

<style src="./activity-details-page.css"></style>

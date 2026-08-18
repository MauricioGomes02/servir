<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppIcon, AppStatusBadge } from '@/shared/ui';
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
  <section v-if="loading" class="activity-details-state" aria-live="polite">
    <p role="status">{{ t('loading') }}</p>
  </section>
  <section
    v-else-if="problem"
    class="activity-details-state"
    aria-labelledby="activity-details-error-title"
  >
    <p class="eyebrow">{{ t('cannotContinue') }}</p>
    <h1 id="activity-details-error-title">{{ problem.problem.title }}</h1>
    <p>{{ t('errorDescription') }}</p>
    <div class="activity-details-actions">
      <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
      <RouterLink
        :to="{ name: 'organization-activities', params: { organizationId } }"
        class="app-button app-button-tertiary"
        >{{ t('back') }}</RouterLink
      >
    </div>
  </section>
  <article v-else-if="activity" class="activity-details" aria-labelledby="activity-title">
    <nav class="activity-details-navigation" :aria-label="t('navigation')">
      <RouterLink
        class="activity-back-link app-button app-button-secondary"
        :to="{ name: 'organization-activities', params: { organizationId } }"
      >
        <AppIcon name="back" />
        <span>{{ t('back') }}</span>
      </RouterLink>
    </nav>
    <header class="activity-details-header">
      <div>
        <p class="eyebrow">{{ t('eyebrow') }}</p>
        <h1 id="activity-title">{{ activity.name }}</h1>
        <p>{{ t('description') }}</p>
      </div>
      <AppStatusBadge :tone="activity.status === 'active' ? 'success' : 'neutral'">{{
        activity.status === 'active' ? t('active') : t('inactive')
      }}</AppStatusBadge>
    </header>
    <section class="activity-participants" aria-labelledby="activity-participants-title">
      <div>
        <p class="eyebrow">{{ t('participation') }}</p>
        <h2 id="activity-participants-title">{{ t('ministries') }}</h2>
      </div>
      <ul>
        <li v-for="ministry in activity.ministries" :key="ministry.id">
          <RouterLink
            :to="{ name: 'ministry-details', params: { organizationId, ministryId: ministry.id } }"
            >{{ ministry.name }} <AppIcon name="arrow"
          /></RouterLink>
        </li>
      </ul>
    </section>
  </article>
</template>

<style src="./activity-details-page.css"></style>

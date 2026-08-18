<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppIcon, AppStatusBadge } from '@/shared/ui';
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
  <section v-if="loading" class="member-details-state" aria-live="polite">
    <p role="status">{{ t('loading') }}</p>
  </section>
  <section
    v-else-if="problem"
    class="member-details-state"
    aria-labelledby="member-details-error-title"
  >
    <p class="eyebrow">{{ t('cannotContinue') }}</p>
    <h1 id="member-details-error-title">{{ problem.problem.title }}</h1>
    <p>{{ t('errorDescription') }}</p>
    <div class="member-details-actions">
      <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
      <RouterLink
        :to="{ name: 'organization-members', params: { organizationId } }"
        class="app-button app-button-tertiary"
      >
        {{ t('back') }}
      </RouterLink>
    </div>
  </section>
  <article v-else-if="member" class="member-details" aria-labelledby="member-title">
    <nav class="member-details-navigation" :aria-label="t('navigation')">
      <RouterLink
        class="member-back-link app-button app-button-secondary"
        :to="{ name: 'organization-members', params: { organizationId } }"
      >
        <AppIcon name="back" />
        <span>{{ t('back') }}</span>
      </RouterLink>
    </nav>
    <header class="member-details-header">
      <div>
        <p class="eyebrow">{{ t('eyebrow') }}</p>
        <h1 id="member-title">{{ member.name }}</h1>
        <p>{{ t('description') }}</p>
      </div>
      <AppStatusBadge :tone="member.status === 'active' ? 'success' : 'neutral'">
        {{ member.status === 'active' ? t('active') : t('inactive') }}
      </AppStatusBadge>
    </header>
  </article>
</template>

<style src="./member-details-page.css"></style>

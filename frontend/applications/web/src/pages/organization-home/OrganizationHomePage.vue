<script setup lang="ts">
import { useLocalizedMessages } from '@/shared/i18n';
import { organizationHomeMessages } from './organization-home.messages';

defineProps<{ organizationId: string }>();
const { t } = useLocalizedMessages(organizationHomeMessages);
</script>

<template>
  <section class="page" aria-labelledby="home-title">
    <header class="page-heading">
      <p class="eyebrow">{{ t('eyebrow') }}</p>
      <h1 id="home-title">{{ t('title') }}</h1>
      <p>{{ t('description') }}</p>
    </header>

    <section class="next-step" aria-labelledby="next-step-title">
      <div>
        <p class="eyebrow">{{ t('prepare') }}</p>
        <h2 id="next-step-title">{{ t('nextTitle') }}</h2>
        <p>{{ t('nextDescription') }}</p>
      </div>
      <RouterLink
        class="app-button app-button-primary app-button-large"
        :to="{ name: 'organization-ministries', params: { organizationId } }"
      >
        {{ t('action') }}
      </RouterLink>
    </section>
  </section>
</template>

<style src="./organization-home-page.css"></style>

<script setup lang="ts">
import { useLocalizedMessages } from '@/shared/i18n';
import { notFoundMessages } from './not-found.messages';

const { t } = useLocalizedMessages(notFoundMessages);
</script>

<template>
  <main id="main-content" class="not-found-page" tabindex="-1" aria-labelledby="not-found-title">
    <p class="eyebrow">{{ t('eyebrow') }}</p>
    <h1 id="not-found-title">{{ t('title') }}</h1>
    <p>{{ t('description') }}</p>
    <RouterLink class="not-found-action" :to="{ name: 'accessible-organizations' }">
      {{ t('action') }}
    </RouterLink>
  </main>
</template>

<style src="./not-found-page.css"></style>

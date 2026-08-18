<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { SignOutButton } from '@/features/sign-out';
import { useSessionStore } from '@/shared/auth';
import { useI18n } from '@/shared/i18n';
import ThemeControl from '@/shared/theme/ThemeControl.vue';

const route = useRoute();
const session = useSessionStore();
const { t } = useI18n();
</script>

<template>
  <a class="skip-link" href="#main-content">{{ t('app.skip_to_content') }}</a>
  <header class="site-header">
    <RouterLink
      class="brand"
      :to="{ name: 'accessible-organizations' }"
      :aria-label="t('app.home')"
    >
      <span class="brand-mark" aria-hidden="true">S</span>
      <span
        ><strong>Servir</strong><small>{{ t('app.tagline') }}</small></span
      >
    </RouterLink>
    <ThemeControl :key="route.fullPath">
      <template v-if="session.snapshot.value?.authenticated" #account>
        <SignOutButton />
      </template>
    </ThemeControl>
  </header>
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
</template>

<style src="../app.css"></style>

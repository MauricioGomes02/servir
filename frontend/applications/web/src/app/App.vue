<script setup lang="ts">
import { RouterView } from 'vue-router';
import ThemeControl from '@/shared/theme/ThemeControl.vue';
import { SignOutButton } from '@/features/sign-out';
import { useSessionStore } from '@/shared/auth';
import { useI18n } from '@/shared/i18n';
import { useAppNavigation } from './use-app-navigation';

const { brandCanNavigate, homeRoute } = useAppNavigation();
const session = useSessionStore();
const { t } = useI18n();
</script>

<template>
  <a class="skip-link" href="#main-content">{{ t('app.skip_to_content') }}</a>
  <header class="site-header">
    <RouterLink
      v-if="brandCanNavigate"
      class="brand"
      :to="homeRoute"
      :aria-label="t('app.organization_home')"
    >
      <span class="brand-mark" aria-hidden="true">S</span>
      <span
        ><strong>Servir</strong><small>{{ t('app.tagline') }}</small></span
      >
    </RouterLink>
    <span v-else class="brand brand-static" aria-label="Servir">
      <span class="brand-mark" aria-hidden="true">S</span>
      <span
        ><strong>Servir</strong><small>{{ t('app.tagline') }}</small></span
      >
    </span>
    <ThemeControl>
      <template v-if="session.snapshot.value?.authenticated" #account>
        <SignOutButton />
      </template>
    </ThemeControl>
  </header>
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
</template>

<style src="./app.css"></style>

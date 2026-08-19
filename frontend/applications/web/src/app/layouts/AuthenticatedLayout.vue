<script setup lang="ts">
import { ref, toRef } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { SignOutButton } from '@/features/sign-out';
import { useSessionStore } from '@/shared/auth';
import { useI18n } from '@/shared/i18n';
import { KeyboardHelp } from '@/shared/keyboard-help';
import ThemeControl from '@/shared/theme/ThemeControl.vue';
import { useRouteFocus } from '../use-route-focus';

const route = useRoute();
const session = useSessionStore();
const { t } = useI18n();
const keyboardHelp = ref<InstanceType<typeof KeyboardHelp>>();
const themeControl = ref<InstanceType<typeof ThemeControl>>();
useRouteFocus(toRef(() => route));
</script>

<template>
  <nav class="skip-links" :aria-label="t('app.skip_links')">
    <a class="skip-link" href="#main-content">{{ t('app.skip_to_content') }}</a>
    <a v-if="route.meta.navigationArea" class="skip-link" href="#organization-navigation">
      {{ t('app.skip_to_navigation') }}
    </a>
    <a class="skip-link" href="#keyboard-help-trigger">{{ t('app.skip_to_keyboard_help') }}</a>
  </nav>
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
    <div class="header-tools">
      <KeyboardHelp ref="keyboardHelp" @opened="themeControl?.close()" />
      <ThemeControl :key="route.fullPath" ref="themeControl" @opened="keyboardHelp?.close()">
        <template v-if="session.snapshot.value?.authenticated" #account>
          <SignOutButton />
        </template>
      </ThemeControl>
    </div>
  </header>
  <RouterView />
</template>

<style src="../app.css"></style>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import ThemeControl from '@/shared/theme/ThemeControl.vue';
import { useAppNavigation } from './use-app-navigation';

const { brandCanNavigate, homeRoute } = useAppNavigation();
</script>

<template>
  <a class="skip-link" href="#main-content">Ir para o conteúdo principal</a>
  <header class="site-header">
    <RouterLink
      v-if="brandCanNavigate"
      class="brand"
      :to="homeRoute"
      aria-label="Ir para o início da organização"
    >
      <span class="brand-mark" aria-hidden="true">S</span>
      <span><strong>Servir</strong><small>Comunidades que cuidam</small></span>
    </RouterLink>
    <span v-else class="brand brand-static" aria-label="Servir">
      <span class="brand-mark" aria-hidden="true">S</span>
      <span><strong>Servir</strong><small>Comunidades que cuidam</small></span>
    </span>
    <ThemeControl />
  </header>
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
</template>

<style src="./app.css"></style>

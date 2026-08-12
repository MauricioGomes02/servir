<script setup lang="ts">
import { RouterView } from 'vue-router';
import ThemeControl from '@/shared/theme/ThemeControl.vue';
</script>

<template>
  <a class="skip-link" href="#main-content">Ir para o conteúdo principal</a>
  <header class="site-header">
    <RouterLink
      class="brand"
      :to="{ name: 'create-organization' }"
      aria-label="Servir — página inicial"
    >
      <span class="brand-mark" aria-hidden="true">S</span>
      <span><strong>Servir</strong><small>Comunidades que cuidam</small></span>
    </RouterLink>
    <ThemeControl />
  </header>
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
</template>

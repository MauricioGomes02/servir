<script setup lang="ts">
import { RouterView } from 'vue-router';
import ThemeControl from '@/shared/theme/ThemeControl.vue';
</script>

<template>
  <a class="skip-link" href="#main-content">Ir para o conteúdo principal</a>
  <header class="site-header">
    <a class="brand" href="/" aria-label="Servir — página inicial">
      <span class="brand-mark" aria-hidden="true">S</span>
      <span>Servir</span>
    </a>
    <ThemeControl />
  </header>
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import { useRoute } from 'vue-router';
import ThemeControl from '@/shared/theme/ThemeControl.vue';

const route = useRoute();
const homeRoute = computed(() => {
  const organizationId = route.params.organizationId;
  return typeof organizationId === 'string'
    ? { name: 'organization-home', params: { organizationId } }
    : { name: 'create-organization' };
});
</script>

<template>
  <a class="skip-link" href="#main-content">Ir para o conteúdo principal</a>
  <header class="site-header">
    <RouterLink class="brand" :to="homeRoute" aria-label="Servir — página inicial">
      <span class="brand-mark" aria-hidden="true">S</span>
      <span><strong>Servir</strong><small>Comunidades que cuidam</small></span>
    </RouterLink>
    <ThemeControl />
  </header>
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
</template>

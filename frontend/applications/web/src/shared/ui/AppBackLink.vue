<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import AppIcon from './AppIcon.vue';

defineProps<{ to: RouteLocationRaw }>();
</script>

<template>
  <RouterLink class="app-back-link app-button app-button-secondary" :to="to">
    <AppIcon name="back" />
    <span><slot /></span>
  </RouterLink>
</template>

<style src="./app-back-link.css"></style>

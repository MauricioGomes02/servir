<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

defineProps<{ to: RouteLocationRaw; accessibleLabel: string }>();
</script>

<template>
  <li class="app-resource-list-item">
    <RouterLink class="app-resource-list-link" :to="to" :aria-label="accessibleLabel">
      <span class="app-resource-list-primary"><slot name="primary" /></span>
      <span class="app-resource-list-meta"><slot name="meta" /></span>
      <span class="app-resource-list-action"><slot name="action" /></span>
    </RouterLink>
  </li>
</template>

<style src="./app-resource-list-item.css"></style>

<script setup lang="ts">
import AppIcon from './AppIcon.vue';
import AppStatusBadge from './AppStatusBadge.vue';

defineProps<{
  title: string;
  description: string;
  icon: 'people' | 'ministry' | 'calendar';
}>();
</script>

<template>
  <article class="feature-card">
    <span class="feature-card-icon"><AppIcon :name="icon" /></span>
    <div>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <AppStatusBadge>Em breve</AppStatusBadge>
  </article>
</template>

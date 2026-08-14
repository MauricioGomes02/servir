<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'success' | 'neutral' }>(), { tone: 'neutral' });
</script>

<template>
  <span class="status-badge" :class="`status-badge-${tone}`"><slot /></span>
</template>

<style src="./app-status-badge.css"></style>

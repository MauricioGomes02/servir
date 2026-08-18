<script setup lang="ts">
defineProps<{ titleId: string }>();
</script>

<template>
  <header class="app-detail-header">
    <div class="app-detail-heading">
      <p v-if="$slots.eyebrow" class="eyebrow"><slot name="eyebrow" /></p>
      <h1 :id="titleId"><slot name="title" /></h1>
      <p v-if="$slots.description" class="app-detail-description">
        <slot name="description" />
      </p>
    </div>
    <div v-if="$slots.aside" class="app-detail-aside"><slot name="aside" /></div>
  </header>
</template>

<style src="./app-detail-header.css"></style>

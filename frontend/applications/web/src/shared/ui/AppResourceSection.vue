<script setup lang="ts">
defineProps<{ titleId: string }>();
</script>

<template>
  <section class="app-resource-section" :aria-labelledby="titleId">
    <header class="app-resource-toolbar">
      <div class="app-resource-heading">
        <h2 :id="titleId"><slot name="title" /></h2>
        <p v-if="$slots.summary"><slot name="summary" /></p>
      </div>
      <div v-if="$slots.controls" class="app-resource-controls"><slot name="controls" /></div>
    </header>
    <div class="app-resource-content"><slot /></div>
  </section>
</template>

<style src="./app-resource-section.css"></style>

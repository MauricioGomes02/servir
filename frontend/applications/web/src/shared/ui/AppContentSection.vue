<script setup lang="ts">
defineProps<{ titleId: string }>();
</script>

<template>
  <section class="app-content-section" :aria-labelledby="titleId">
    <header class="app-content-section-header">
      <div>
        <p v-if="$slots.eyebrow" class="eyebrow"><slot name="eyebrow" /></p>
        <h2 :id="titleId"><slot name="title" /></h2>
      </div>
      <div v-if="$slots.actions" class="app-content-section-actions"><slot name="actions" /></div>
    </header>
    <div class="app-content-section-body"><slot /></div>
  </section>
</template>

<style src="./app-content-section.css"></style>

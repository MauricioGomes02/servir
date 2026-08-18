<script setup lang="ts">
withDefaults(defineProps<{ titleId?: string; loading?: boolean }>(), {
  titleId: undefined,
  loading: false,
});
</script>

<template>
  <section
    class="app-route-state"
    :aria-labelledby="loading ? undefined : titleId"
    :aria-live="loading ? 'polite' : undefined"
  >
    <p v-if="loading" role="status"><slot name="status" /></p>
    <template v-else>
      <p class="eyebrow"><slot name="eyebrow" /></p>
      <h1 :id="titleId"><slot name="title" /></h1>
      <p class="app-route-state-description"><slot name="description" /></p>
      <div class="app-route-state-actions"><slot name="actions" /></div>
    </template>
  </section>
</template>

<style src="./app-route-state.css"></style>

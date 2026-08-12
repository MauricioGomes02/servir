<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary';
    loading?: boolean;
  }>(),
  { type: 'button', variant: 'primary', loading: false },
);
</script>

<template>
  <button class="app-button" :class="`app-button-${variant}`" :type="type" :disabled="loading">
    <span v-if="loading">Aguarde…</span>
    <slot v-else />
  </button>
</template>

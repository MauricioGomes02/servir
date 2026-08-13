<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
  }>(),
  {
    type: 'button',
    variant: 'primary',
    size: 'medium',
    loading: false,
    disabled: false,
    fullWidth: false,
  },
);

const emit = defineEmits<{ click: [event: MouseEvent] }>();

function handleClick(event: MouseEvent): void {
  if (props.disabled || props.loading) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  emit('click', event);
}
</script>

<template>
  <button
    class="app-button"
    :class="[
      `app-button-${variant}`,
      `app-button-${size}`,
      { 'app-button-full-width': fullWidth, 'app-button-loading': loading },
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="handleClick"
  >
    <span v-if="$slots.leading" class="app-button-icon" aria-hidden="true"
      ><slot name="leading"
    /></span>
    <span class="app-button-label"><slot /></span>
    <span v-if="loading" class="app-button-spinner" aria-hidden="true"></span>
    <span v-if="loading" class="visually-hidden">, em andamento</span>
    <span v-else-if="$slots.trailing" class="app-button-icon" aria-hidden="true"
      ><slot name="trailing"
    /></span>
  </button>
</template>

<style src="./app-button.css"></style>

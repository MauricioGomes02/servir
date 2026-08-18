<script setup lang="ts">
import AppIcon from './AppIcon.vue';

const model = defineModel<string>({ required: true });
withDefaults(
  defineProps<{
    id: string;
    label: string;
    clearLabel: string;
    placeholder?: string;
    maxlength?: number;
  }>(),
  { placeholder: undefined, maxlength: undefined },
);
const emit = defineEmits<{ search: []; clear: [] }>();

function clear(): void {
  model.value = '';
  emit('clear');
}
</script>

<template>
  <form class="app-search" role="search" @submit.prevent="emit('search')">
    <label class="visually-hidden" :for="id">{{ label }}</label>
    <span class="app-search-icon"><AppIcon name="search" /></span>
    <input
      :id="id"
      v-model="model"
      type="search"
      autocomplete="off"
      :maxlength="maxlength"
      :placeholder="placeholder ?? label"
    />
    <button
      v-if="model"
      class="app-search-clear"
      type="button"
      :aria-label="clearLabel"
      @click="clear"
    >
      <AppIcon name="close" />
    </button>
  </form>
</template>

<style src="./app-search-field.css"></style>

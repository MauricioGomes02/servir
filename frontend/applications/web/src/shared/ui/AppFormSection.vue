<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  id: string;
  triggerId: string;
  title: string;
  description: string;
  busy?: boolean;
}>();
const emit = defineEmits<{ submit: [] }>();
const form = ref<HTMLFormElement>();

watch(
  () => props.open,
  async (open, wasOpen) => {
    await nextTick();
    if (open) {
      form.value?.querySelector<HTMLElement>('[data-autofocus], input, select, textarea')?.focus();
    } else if (wasOpen) {
      document.getElementById(props.triggerId)?.focus();
    }
  },
);
</script>

<template>
  <form
    v-if="open"
    :id="id"
    ref="form"
    class="app-form-section"
    novalidate
    @submit.prevent="emit('submit')"
  >
    <fieldset :disabled="busy">
      <legend>{{ title }}</legend>
      <p class="app-form-description">{{ description }}</p>
      <div class="app-form-fields"><slot /></div>
      <footer class="app-form-actions"><slot name="actions" /></footer>
    </fieldset>
  </form>
</template>

<style src="./app-form-section.css"></style>

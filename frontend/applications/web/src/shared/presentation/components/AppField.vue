<script setup lang="ts">
const model = defineModel<string>({ required: true });
defineProps<{ id: string; label: string; errors?: readonly string[]; maxlength?: number }>();
</script>

<template>
  <div class="app-field">
    <label :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :name="id"
      type="text"
      autocomplete="organization"
      :maxlength="maxlength"
      required
      :aria-invalid="Boolean(errors?.length)"
      :aria-describedby="errors?.length ? `${id}-errors` : undefined"
    />
    <ul v-if="errors?.length" :id="`${id}-errors`" class="field-errors">
      <li v-for="error in errors" :key="error">{{ error }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { readThemePreference, setThemePreference, type ThemePreference } from './theme';

const preference = ref(readThemePreference());

function changeTheme(event: Event): void {
  const select = event.currentTarget as HTMLSelectElement;
  preference.value = select.value as ThemePreference;
  setThemePreference(preference.value);
}
</script>

<template>
  <div class="theme-control">
    <label for="theme-preference">Tema</label>
    <select id="theme-preference" :value="preference" @change="changeTheme">
      <option value="system">Sistema</option>
      <option value="light">Claro</option>
      <option value="dark">Escuro</option>
    </select>
  </div>
</template>

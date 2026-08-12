<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import AppIcon from '@/shared/presentation/components/AppIcon.vue';
import { readThemePreference, setThemePreference, type ThemePreference } from './theme';

const preference = ref(readThemePreference());
const open = ref(false);
const trigger = ref<HTMLButtonElement>();

function chooseTheme(value: ThemePreference): void {
  preference.value = value;
  setThemePreference(value);
}

function closeMenu(restoreFocus = false): void {
  open.value = false;
  if (restoreFocus) trigger.value?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && open.value) closeMenu(true);
}

document.addEventListener('keydown', onKeydown);
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="settings">
    <button
      ref="trigger"
      class="icon-button"
      type="button"
      aria-label="Abrir configurações"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="open = !open"
    >
      <AppIcon name="settings" />
    </button>
    <section v-if="open" class="settings-panel" role="dialog" aria-label="Configurações">
      <header>
        <div>
          <p class="eyebrow">Preferências</p>
          <h2>Configurações</h2>
        </div>
        <button class="text-button" type="button" @click="closeMenu(true)">Fechar</button>
      </header>
      <fieldset class="theme-options">
        <legend>Aparência</legend>
        <label
          v-for="option in ['system', 'light', 'dark'] as const"
          :key="option"
          :for="`theme-${option}`"
        >
          <input
            :id="`theme-${option}`"
            v-model="preference"
            type="radio"
            name="theme"
            :value="option"
            @change="chooseTheme(option)"
          />
          <span>{{
            { system: 'Usar tema do sistema', light: 'Tema claro', dark: 'Tema escuro' }[option]
          }}</span>
        </label>
      </fieldset>
    </section>
  </div>
</template>

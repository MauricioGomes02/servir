<script setup lang="ts">
import { AppIcon } from '@/shared/ui';
import { useThemeControl } from './use-theme-control';

const { chooseTheme, closeMenu, open, preference, setTrigger } = useThemeControl();
</script>

<template>
  <div class="settings">
    <button
      :ref="setTrigger"
      class="icon-button"
      type="button"
      aria-label="Abrir configurações"
      aria-haspopup="dialog"
      :aria-expanded="open"
      aria-controls="appearance-settings"
      @click="open = !open"
    >
      <AppIcon name="settings" />
    </button>
    <section
      v-if="open"
      id="appearance-settings"
      class="settings-panel"
      role="dialog"
      aria-label="Configurações"
    >
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

<style src="./theme-control.css"></style>

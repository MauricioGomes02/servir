<script setup lang="ts">
import { AppIcon } from '@/shared/ui';
import { useThemeControl } from './use-theme-control';

const {
  chooseTheme,
  closeMenu,
  onThemeKeydown,
  open,
  preference,
  setPanel,
  setTrigger,
  themeOptions,
  toggleMenu,
} = useThemeControl();
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
      aria-keyshortcuts="Alt+Shift+T"
      @click="toggleMenu"
    >
      <AppIcon name="settings" />
    </button>
    <section
      v-if="open"
      id="appearance-settings"
      :ref="setPanel"
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
      <p id="theme-shortcut" class="theme-shortcut">
        Atalho: <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd>
      </p>
      <fieldset class="theme-options" aria-describedby="theme-shortcut">
        <legend>Aparência</legend>
        <label v-for="option in themeOptions" :key="option" :for="`theme-${option}`">
          <input
            :id="`theme-${option}`"
            v-model="preference"
            type="radio"
            name="theme"
            :value="option"
            @change="chooseTheme(option)"
            @keydown="onThemeKeydown"
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

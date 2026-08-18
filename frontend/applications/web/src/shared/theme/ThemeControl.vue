<script setup lang="ts">
import { AppIcon } from '@/shared/ui';
import { supportedLocales, useI18n, type SupportedLocale } from '@/shared/i18n';
import { useThemeControl } from './use-theme-control';

const { locale, setLocale, t } = useI18n();

function themeLabel(option: 'system' | 'light' | 'dark'): string {
  return {
    system: t('settings.theme.system'),
    light: t('settings.theme.light'),
    dark: t('settings.theme.dark'),
  }[option];
}

function chooseLocale(event: Event): void {
  const input = event.currentTarget as HTMLInputElement;
  setLocale(input.value as SupportedLocale);
}

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
      :aria-label="t('settings.open')"
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
      :aria-label="t('settings.title')"
    >
      <header>
        <div>
          <p class="eyebrow">{{ t('settings.preferences') }}</p>
          <h2>{{ t('settings.title') }}</h2>
        </div>
        <button class="text-button" type="button" @click="closeMenu(true)">
          {{ t('settings.close') }}
        </button>
      </header>
      <p id="theme-shortcut" class="theme-shortcut">
        {{ t('settings.shortcut') }}: <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd>
      </p>
      <fieldset class="theme-options" aria-describedby="theme-shortcut">
        <legend>{{ t('settings.appearance') }}</legend>
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
          <span>{{ themeLabel(option) }}</span>
        </label>
      </fieldset>
      <fieldset class="theme-options locale-options">
        <legend>{{ t('settings.language') }}</legend>
        <label v-for="option in supportedLocales" :key="option" :for="`locale-${option}`">
          <input
            :id="`locale-${option}`"
            type="radio"
            name="locale"
            :value="option"
            :checked="locale === option"
            @change="chooseLocale"
          />
          <span>{{ t(`settings.language.${option}`) }}</span>
        </label>
      </fieldset>
      <div v-if="$slots.account" class="account-settings">
        <slot name="account" />
      </div>
    </section>
  </div>
</template>

<style src="./theme-control.css"></style>

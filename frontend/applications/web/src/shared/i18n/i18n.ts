import type { App, InjectionKey, Ref } from 'vue';
import { inject, readonly, ref } from 'vue';
import { messages, type MessageKey } from './messages';
import { WebRuntimeError, WebRuntimeErrorCodes } from '@/shared/errors';

export const supportedLocales = ['pt-BR', 'en-US'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

const LOCALE_STORAGE_KEY = 'servir.locale';
export const localeState = ref<SupportedLocale>('pt-BR');

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

function initialLocale(): SupportedLocale {
  const stored = globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY);
  if (isSupportedLocale(stored)) return stored;
  return globalThis.navigator?.language?.toLowerCase().startsWith('en') ? 'en-US' : 'pt-BR';
}

export interface I18n {
  readonly locale: Readonly<Ref<SupportedLocale>>;
  setLocale(locale: SupportedLocale): void;
  t(key: MessageKey): string;
}

const i18nKey: InjectionKey<I18n> = Symbol('servir.i18n');

export function createI18n(locale = initialLocale()) {
  const selectedLocale = ref(locale);
  localeState.value = locale;
  const i18n: I18n = {
    locale: readonly(selectedLocale),
    setLocale(nextLocale) {
      selectedLocale.value = nextLocale;
      localeState.value = nextLocale;
      document.documentElement.lang = nextLocale;
      localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    },
    t(key) {
      return messages[selectedLocale.value][key];
    },
  };
  return {
    install(app: App) {
      document.documentElement.lang = selectedLocale.value;
      app.provide(i18nKey, i18n);
    },
    i18n,
  };
}

export function useI18n(): I18n {
  const i18n = inject(i18nKey);
  if (i18n === undefined) {
    throw new WebRuntimeError(WebRuntimeErrorCodes.I18nProviderUnavailable);
  }
  return i18n;
}

export function currentLocale(): SupportedLocale {
  return localeState.value;
}

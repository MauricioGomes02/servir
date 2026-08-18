import { readonly, type Ref } from 'vue';
import { localeState, type SupportedLocale } from './i18n';

type MessageCatalog = Readonly<Record<string, string>>;

export function defineLocalizedMessages<const TMessages extends MessageCatalog>(catalogs: {
  readonly 'pt-BR': TMessages;
  readonly 'en-US': Readonly<Record<keyof TMessages, string>>;
}): Readonly<Record<SupportedLocale, Readonly<Record<keyof TMessages, string>>>> {
  return Object.freeze({
    'pt-BR': Object.freeze(catalogs['pt-BR']),
    'en-US': Object.freeze(catalogs['en-US']),
  });
}

export function useLocalizedMessages<const TMessages extends MessageCatalog>(
  catalogs: Readonly<Record<SupportedLocale, Readonly<Record<keyof TMessages, string>>>>,
): {
  readonly locale: Readonly<Ref<SupportedLocale>>;
  t(key: keyof TMessages): string;
} {
  return {
    locale: readonly(localeState),
    t(key) {
      return catalogs[localeState.value][key];
    },
  };
}

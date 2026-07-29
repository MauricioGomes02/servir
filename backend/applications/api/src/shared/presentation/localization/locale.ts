export const SupportedLocales = {
  PortugueseBrazil: 'pt-BR',
  EnglishUnitedStates: 'en-US',
} as const;

export type SupportedLocale =
  (typeof SupportedLocales)[keyof typeof SupportedLocales];

export const DefaultLocale = SupportedLocales.PortugueseBrazil;

const LocaleAliases: Readonly<Record<string, SupportedLocale>> =
  Object.freeze({
    pt: SupportedLocales.PortugueseBrazil,
    en: SupportedLocales.EnglishUnitedStates,
  });

export function resolveLocale(candidate: unknown): SupportedLocale {
  if (typeof candidate !== 'string') {
    return DefaultLocale;
  }

  const normalized = candidate.trim().toLowerCase();

  const supportedLocale = Object.values(SupportedLocales).find(
    (locale) => locale.toLowerCase() === normalized,
  );

  return supportedLocale ?? LocaleAliases[normalized] ?? DefaultLocale;
}

export function resolveLocaleCandidates(
  candidates: ReadonlyArray<unknown>,
): SupportedLocale {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue;
    }

    const normalized = candidate.trim().toLowerCase();
    const supportedLocale = Object.values(SupportedLocales).find(
      (locale) => locale.toLowerCase() === normalized,
    );
    const locale = supportedLocale ?? LocaleAliases[normalized];

    if (locale !== undefined) {
      return locale;
    }
  }

  return DefaultLocale;
}

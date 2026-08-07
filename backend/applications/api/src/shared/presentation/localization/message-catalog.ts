import type { SupportedLocale } from './locale';

export type MessageCatalog = Readonly<Record<SupportedLocale, Readonly<Record<string, string>>>>;

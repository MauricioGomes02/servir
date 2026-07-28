import type { NotificationErrorParams } from '@/shared/domain/notification';

import type { SupportedLocale } from './locale';

export interface TranslateMessageInput {
  readonly code: string;
  readonly locale: SupportedLocale;
  readonly parameters?: NotificationErrorParams;
}

export interface MessageTranslator {
  translate(input: TranslateMessageInput): string;
}

import type {
  MessageCatalog,
  MessageTranslator,
  TranslateMessageInput,
} from '@/shared/presentation/localization';

const MISSING_TRANSLATION = Object.freeze({
  'pt-BR': 'Nao foi possivel processar a solicitacao.',
  'en-US': 'The request could not be processed.',
});

export class InMemoryMessageTranslator implements MessageTranslator {
  private readonly catalog: MessageCatalog;

  constructor(catalog: MessageCatalog) {
    this.catalog = Object.freeze({
      'pt-BR': Object.freeze({ ...catalog['pt-BR'] }),
      'en-US': Object.freeze({ ...catalog['en-US'] }),
    });
  }

  translate(input: TranslateMessageInput): string {
    const template = this.catalog[input.locale][input.code]
      ?? MISSING_TRANSLATION[input.locale];

    return template.replace(
      /\{([^{}]+)\}/g,
      (placeholder, parameter: string) => {
        const value = input.parameters?.[parameter];

        return value === undefined ? placeholder : String(value);
      },
    );
  }
}

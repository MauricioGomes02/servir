import { defineLocalizedMessages } from '@/shared/i18n';

export const notFoundMessages = defineLocalizedMessages({
  'pt-BR': {
    eyebrow: 'Caminho não encontrado',
    title: 'Esta página não existe',
    description:
      'O endereço pode estar incorreto ou a página pode ter sido movida. Você pode continuar a partir das suas igrejas.',
    action: 'Ir para minhas igrejas',
  },
  'en-US': {
    eyebrow: 'Page not found',
    title: 'This page does not exist',
    description:
      'The address may be incorrect or the page may have moved. You can continue from your churches.',
    action: 'Go to my churches',
  },
});

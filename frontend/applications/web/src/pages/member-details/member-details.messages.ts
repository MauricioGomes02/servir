import { defineLocalizedMessages } from '@/shared/i18n';
export const memberDetailsMessages = defineLocalizedMessages({
  'pt-BR': {
    loading: 'Carregando membro…',
    cannotContinue: 'Não foi possível continuar',
    errorDescription: 'Você pode tentar novamente ou voltar para a lista de membros.',
    retry: 'Tentar novamente',
    back: 'Voltar para a lista de membros',
    navigation: 'Navegação do membro',
    eyebrow: 'Membro da comunidade',
    description: 'Cadastro reconhecido nesta organização.',
    active: 'Ativo',
    inactive: 'Inativo',
    fallbackError: 'Não foi possível carregar o membro.',
  },
  'en-US': {
    loading: 'Loading member…',
    cannotContinue: 'Could not continue',
    errorDescription: 'You can try again or return to the member list.',
    retry: 'Try again',
    back: 'Back to the member list',
    navigation: 'Member navigation',
    eyebrow: 'Community member',
    description: 'Member recognized in this organization.',
    active: 'Active',
    inactive: 'Inactive',
    fallbackError: 'The member could not be loaded.',
  },
});

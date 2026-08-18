import { defineLocalizedMessages } from '@/shared/i18n';

export const organizationLayoutMessages = defineLocalizedMessages({
  'pt-BR': {
    loading: 'Carregando sua igreja…',
    cannotContinue: 'Não foi possível continuar',
    retry: 'Tentar novamente',
    back: 'Voltar às minhas igrejas',
    organization: 'Igreja',
    active: 'Ativa',
    switchOrganization: 'Trocar de igreja',
    navigation: 'Navegação da igreja',
    home: 'Início',
    ministries: 'Ministérios',
    members: 'Membros',
    activities: 'Atividades',
    fallbackError: 'Não foi possível carregar a igreja.',
  },
  'en-US': {
    loading: 'Loading your church…',
    cannotContinue: 'Could not continue',
    retry: 'Try again',
    back: 'Back to my churches',
    organization: 'Church',
    active: 'Active',
    switchOrganization: 'Switch church',
    navigation: 'Church navigation',
    home: 'Home',
    ministries: 'Ministries',
    members: 'Members',
    activities: 'Activities',
    fallbackError: 'The church could not be loaded.',
  },
});

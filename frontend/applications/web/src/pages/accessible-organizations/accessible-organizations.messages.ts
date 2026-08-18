import { defineLocalizedMessages } from '@/shared/i18n';

export const accessibleOrganizationsMessages = defineLocalizedMessages({
  'pt-BR': {
    eyebrow: 'Seu espaço no Servir',
    title: 'Escolha a igreja que você quer acessar',
    description: 'Você verá somente as comunidades em que possui acesso ativo.',
    loading: 'Buscando suas igrejas...',
    errorTitle: 'Não conseguimos carregar suas igrejas',
    retry: 'Tentar carregar novamente',
    fallbackError: 'Não foi possível carregar suas igrejas.',
    emptyTitle: 'Você ainda não participa de uma igreja no Servir',
    emptyDescription: 'Crie o espaço da sua comunidade ou aguarde um convite de um administrador.',
    create: 'Criar o espaço da minha igreja',
    available: 'Igrejas disponíveis',
    access: 'Acessar esta igreja',
    another: 'Cadastrar outra igreja',
  },
  'en-US': {
    eyebrow: 'Your Servir space',
    title: 'Choose the church you want to access',
    description: 'You will only see communities where you have active access.',
    loading: 'Finding your churches...',
    errorTitle: 'We could not load your churches',
    retry: 'Try loading again',
    fallbackError: 'Your churches could not be loaded.',
    emptyTitle: 'You are not part of a church on Servir yet',
    emptyDescription: 'Create your community space or wait for an administrator invitation.',
    create: 'Create my church space',
    available: 'Available churches',
    access: 'Access this church',
    another: 'Register another church',
  },
});

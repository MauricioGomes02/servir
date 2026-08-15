<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppIcon, AppStatusBadge } from '@/shared/ui';
import { useMemberDetailsPage } from './use-member-details-page';

const props = defineProps<{ organizationId: string; memberId: string }>();
const { load, loading, member, problem } = useMemberDetailsPage(
  toRef(props, 'organizationId'),
  toRef(props, 'memberId'),
);
</script>

<template>
  <section v-if="loading" class="member-details-state" aria-live="polite">
    <p role="status">Carregando membro…</p>
  </section>
  <section
    v-else-if="problem"
    class="member-details-state"
    aria-labelledby="member-details-error-title"
  >
    <p class="eyebrow">Não foi possível continuar</p>
    <h1 id="member-details-error-title">{{ problem.problem.title }}</h1>
    <p>Você pode tentar novamente ou voltar para a lista de membros.</p>
    <div class="member-details-actions">
      <AppButton variant="secondary" @click="load">Tentar novamente</AppButton>
      <RouterLink
        :to="{ name: 'organization-members', params: { organizationId } }"
        class="app-button app-button-tertiary"
      >
        Voltar para a lista de membros
      </RouterLink>
    </div>
  </section>
  <article v-else-if="member" class="member-details" aria-labelledby="member-title">
    <nav class="member-details-navigation" aria-label="Navegação do membro">
      <RouterLink
        class="member-back-link app-button app-button-secondary"
        :to="{ name: 'organization-members', params: { organizationId } }"
      >
        <AppIcon name="back" />
        <span>Voltar para a lista de membros</span>
      </RouterLink>
    </nav>
    <header class="member-details-header">
      <div>
        <p class="eyebrow">Membro da comunidade</p>
        <h1 id="member-title">{{ member.name }}</h1>
        <p>Cadastro reconhecido nesta organização.</p>
      </div>
      <AppStatusBadge :tone="member.status === 'active' ? 'success' : 'neutral'">
        {{ member.status === 'active' ? 'Ativo' : 'Inativo' }}
      </AppStatusBadge>
    </header>
  </article>
</template>

<style src="./member-details-page.css"></style>

<script setup lang="ts">
import { toRef } from 'vue';
import AppButton from '@/shared/presentation/components/AppButton.vue';
import AppStatusBadge from '@/shared/presentation/components/AppStatusBadge.vue';
import { useMinistryDetailsView } from './use-ministry-details-view';

const props = defineProps<{ organizationId: string; ministryId: string }>();
const { load, loading, ministry, problem } = useMinistryDetailsView(
  toRef(props, 'organizationId'),
  toRef(props, 'ministryId'),
);
</script>

<template>
  <section v-if="loading" class="ministry-details-state" aria-live="polite">
    <p role="status">Carregando ministério…</p>
  </section>
  <section
    v-else-if="problem"
    class="ministry-details-state"
    aria-labelledby="ministry-details-error-title"
  >
    <p class="eyebrow">Não foi possível continuar</p>
    <h1 id="ministry-details-error-title">{{ problem.problem.title }}</h1>
    <p>Você pode tentar novamente ou voltar à lista de ministérios.</p>
    <div class="ministry-details-actions">
      <AppButton variant="secondary" @click="load">Tentar novamente</AppButton>
      <RouterLink
        :to="{ name: 'organization-ministries', params: { organizationId } }"
        class="app-button app-button-tertiary"
      >
        Voltar aos ministérios
      </RouterLink>
    </div>
  </section>
  <article v-else-if="ministry" class="ministry-details" aria-labelledby="ministry-title">
    <RouterLink
      class="ministry-back-link"
      :to="{ name: 'organization-ministries', params: { organizationId } }"
    >
      Ministérios
    </RouterLink>
    <header class="ministry-details-header">
      <div>
        <p class="eyebrow">Estrutura ministerial</p>
        <h1 id="ministry-title">{{ ministry.name }}</h1>
        <p>Funções que organizam como as pessoas podem servir neste ministério.</p>
      </div>
      <AppStatusBadge :tone="ministry.status === 'active' ? 'success' : 'neutral'">
        {{ ministry.status === 'active' ? 'Ativo' : 'Inativo' }}
      </AppStatusBadge>
    </header>

    <section class="ministry-roles" aria-labelledby="ministry-roles-title">
      <header>
        <div>
          <p class="eyebrow">Organização do serviço</p>
          <h2 id="ministry-roles-title">Funções ministeriais</h2>
        </div>
        <span>{{ ministry.roles.length }}</span>
      </header>
      <p v-if="ministry.roles.length === 0" class="ministry-roles-empty">
        Nenhuma função ministerial foi definida ainda.
      </p>
      <ul v-else>
        <li v-for="role in ministry.roles" :key="role.id">
          <strong>{{ role.name }}</strong>
          <AppStatusBadge :tone="role.status === 'active' ? 'success' : 'neutral'">
            {{ role.status === 'active' ? 'Ativa' : 'Inativa' }}
          </AppStatusBadge>
        </li>
      </ul>
    </section>
  </article>
</template>

<style src="./ministry-details-view.css"></style>

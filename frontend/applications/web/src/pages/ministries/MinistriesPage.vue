<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppField, AppIcon, AppStatusBadge } from '@/shared/ui';
import { useMinistriesPage } from './use-ministries-page';

const props = defineProps<{ organizationId: string }>();
const {
  appliedSearch,
  applySearch,
  clearSearch,
  createMinistry,
  creating,
  creationProblem,
  load,
  loading,
  name,
  nameErrors,
  page,
  problem,
  search,
  showCreation,
} = useMinistriesPage(toRef(props, 'organizationId'));
</script>

<template>
  <section class="page" aria-labelledby="ministries-title">
    <header class="page-heading page-heading-with-action">
      <div>
        <p class="eyebrow">Estrutura ministerial</p>
        <h1 id="ministries-title">Ministérios</h1>
        <p>Organize os espaços onde pessoas, funções e equipes servem juntas.</p>
      </div>
      <AppButton
        :variant="showCreation ? 'secondary' : 'primary'"
        :aria-expanded="showCreation"
        aria-controls="ministry-creation"
        @click="showCreation = !showCreation"
      >
        {{ showCreation ? 'Fechar formulário' : 'Criar novo ministério' }}
      </AppButton>
    </header>

    <form
      v-if="showCreation"
      id="ministry-creation"
      class="inline-form"
      aria-labelledby="ministry-creation-title"
      novalidate
      @submit.prevent="createMinistry"
    >
      <fieldset :disabled="creating">
        <legend id="ministry-creation-title">Criar um ministério</legend>
        <p>Use o nome pelo qual as pessoas reconhecem esse ministério.</p>
        <AppField
          id="ministry-name"
          v-model="name"
          label="Nome do ministério"
          :errors="nameErrors"
          :maxlength="120"
        />
        <p v-if="creationProblem && nameErrors.length === 0" class="form-error" role="alert">
          {{ creationProblem.problem.title }}
        </p>
        <AppButton type="submit" :loading="creating">Criar ministério</AppButton>
        <p class="status" aria-live="polite">{{ creating ? 'Criando ministério.' : '' }}</p>
      </fieldset>
    </form>

    <form class="search-bar" role="search" @submit.prevent="applySearch">
      <label for="ministry-search">Buscar ministérios</label>
      <div>
        <input id="ministry-search" v-model="search" type="search" maxlength="120" />
        <AppButton type="submit" variant="secondary">Buscar</AppButton>
      </div>
    </form>

    <p v-if="loading" class="route-status" role="status">Carregando ministérios…</p>
    <section v-else-if="problem" class="empty-state" aria-labelledby="ministries-error-title">
      <h2 id="ministries-error-title">{{ problem.problem.title }}</h2>
      <p>Você pode tentar carregar novamente sem perder o contexto desta página.</p>
      <AppButton variant="secondary" @click="load">Tentar novamente</AppButton>
    </section>
    <section
      v-else-if="page && page.items.length === 0 && appliedSearch"
      class="empty-state"
      aria-labelledby="search-empty-title"
    >
      <h2 id="search-empty-title">Nenhum ministério encontrado</h2>
      <p>Revise o termo ou volte a visualizar todos os ministérios ativos.</p>
      <AppButton variant="secondary" @click="clearSearch">Limpar busca</AppButton>
    </section>
    <section
      v-else-if="page && page.items.length === 0"
      class="empty-state"
      aria-labelledby="ministries-empty-title"
    >
      <h2 id="ministries-empty-title">Sua estrutura ministerial começa aqui</h2>
      <p>Crie o primeiro ministério para depois organizar funções, equipes e participantes.</p>
      <AppButton @click="showCreation = true">Criar primeiro ministério</AppButton>
    </section>
    <section v-else-if="page" aria-labelledby="ministry-list-title">
      <div class="list-heading">
        <h2 id="ministry-list-title">
          {{ page.pagination.totalItems }}
          {{ page.pagination.totalItems === 1 ? 'ministério ativo' : 'ministérios ativos' }}
        </h2>
      </div>
      <ul class="ministry-list">
        <li v-for="ministry in page.items" :key="ministry.id">
          <RouterLink
            class="ministry-list-link"
            :aria-label="`Ver detalhes do ministério ${ministry.name}`"
            :to="{
              name: 'ministry-details',
              params: { organizationId, ministryId: ministry.id },
            }"
          >
            <div class="ministry-summary">
              <strong>{{ ministry.name }}</strong>
              <span>Estruture funções, pessoas e equipes</span>
            </div>
            <div class="ministry-list-meta">
              <AppStatusBadge tone="success">Ativo</AppStatusBadge>
              <span class="ministry-list-action">
                Ver detalhes
                <AppIcon name="arrow" />
              </span>
            </div>
          </RouterLink>
        </li>
      </ul>
    </section>
  </section>
</template>

<style src="./ministries-page.css"></style>

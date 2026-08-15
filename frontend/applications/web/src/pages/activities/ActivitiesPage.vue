<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppField, AppIcon, AppStatusBadge } from '@/shared/ui';
import { useActivitiesPage } from './use-activities-page';

const props = defineProps<{ organizationId: string }>();
const {
  activities,
  appliedSearch,
  applySearch,
  clearSearch,
  creation,
  creationOpen,
  goToPage,
  load,
  loading,
  ministries,
  problem,
  search,
} = useActivitiesPage(toRef(props, 'organizationId'));
</script>

<template>
  <section class="page" aria-labelledby="activities-title">
    <header class="page-heading page-heading-with-action">
      <div>
        <p class="eyebrow">Operação</p>
        <h1 id="activities-title">Atividades</h1>
        <p>Organize os encontros e ações que precisarão de pessoas servindo.</p>
      </div>
      <AppButton
        :variant="creationOpen ? 'secondary' : 'primary'"
        :aria-expanded="creationOpen"
        aria-controls="activity-creation"
        @click="creationOpen = !creationOpen"
      >
        {{ creationOpen ? 'Fechar formulário' : 'Planejar nova atividade' }}
      </AppButton>
    </header>

    <form
      v-if="creationOpen"
      id="activity-creation"
      class="activity-creation"
      aria-labelledby="activity-creation-title"
      novalidate
      @submit.prevent="creation.create"
    >
      <fieldset :disabled="creation.creating.value">
        <legend id="activity-creation-title">Planejar nova atividade</legend>
        <p>Informe como a comunidade reconhece a atividade e quais ministérios participam dela.</p>
        <AppField
          id="activity-name"
          v-model="creation.name.value"
          label="Nome da atividade"
          :errors="creation.nameErrors.value"
          :maxlength="120"
        />
        <fieldset
          class="activity-ministries"
          :aria-describedby="
            creation.ministryErrors.value.length ? 'activity-ministries-error' : undefined
          "
        >
          <legend>Ministérios participantes</legend>
          <p v-if="ministries.length === 0">
            Crie um ministério ativo antes de planejar uma atividade.
          </p>
          <label
            v-for="ministry in ministries"
            :key="ministry.id"
            :for="`activity-ministry-${ministry.id}`"
          >
            <input
              :id="`activity-ministry-${ministry.id}`"
              v-model="creation.ministryIds.value"
              type="checkbox"
              :value="ministry.id"
            />
            <span>{{ ministry.name }}</span>
          </label>
          <ul
            v-if="creation.ministryErrors.value.length"
            id="activity-ministries-error"
            class="field-errors"
          >
            <li v-for="error in creation.ministryErrors.value" :key="error">{{ error }}</li>
          </ul>
        </fieldset>
        <p
          v-if="
            creation.problem.value &&
            creation.nameErrors.value.length === 0 &&
            creation.ministryErrors.value.length === 0
          "
          class="form-error"
          role="alert"
        >
          {{ creation.problem.value.problem.title }}
        </p>
        <AppButton
          type="submit"
          :loading="creation.creating.value"
          :disabled="ministries.length === 0"
        >
          Criar atividade
        </AppButton>
      </fieldset>
    </form>

    <form class="activity-search" role="search" @submit.prevent="applySearch">
      <label for="activity-search">Buscar atividades</label>
      <div>
        <input id="activity-search" v-model="search" type="search" maxlength="120" />
        <AppButton type="submit" variant="secondary">Buscar atividades</AppButton>
      </div>
    </form>

    <p v-if="loading" class="route-status" role="status">Carregando atividades…</p>
    <section v-else-if="problem" class="empty-state" aria-labelledby="activities-error-title">
      <h2 id="activities-error-title">{{ problem.problem.title }}</h2>
      <p>Você pode tentar carregar novamente sem perder o contexto desta página.</p>
      <AppButton variant="secondary" @click="load">Tentar novamente</AppButton>
    </section>
    <section
      v-else-if="activities && activities.items.length === 0 && appliedSearch"
      class="empty-state"
      aria-labelledby="activity-search-empty-title"
    >
      <h2 id="activity-search-empty-title">Nenhuma atividade encontrada</h2>
      <p>Revise o nome informado ou volte a visualizar todas as atividades ativas.</p>
      <AppButton variant="secondary" @click="clearSearch">Limpar busca de atividades</AppButton>
    </section>
    <section
      v-else-if="activities && activities.items.length === 0"
      class="empty-state"
      aria-labelledby="activities-empty-title"
    >
      <h2 id="activities-empty-title">Comece pela próxima atividade da comunidade</h2>
      <p>Planeje um encontro ou ação para depois organizar suas ocorrências e escalas.</p>
      <AppButton :disabled="ministries.length === 0" @click="creationOpen = true"
        >Planejar primeira atividade</AppButton
      >
    </section>
    <section v-else-if="activities" aria-labelledby="activity-list-title">
      <div class="activity-list-heading">
        <h2 id="activity-list-title">
          {{ activities.pagination.totalItems }}
          {{ activities.pagination.totalItems === 1 ? 'atividade ativa' : 'atividades ativas' }}
        </h2>
      </div>
      <ul class="activity-list">
        <li v-for="activity in activities.items" :key="activity.id">
          <RouterLink
            class="activity-list-link"
            :aria-label="`Ver detalhes da atividade ${activity.name}`"
            :to="{ name: 'activity-details', params: { organizationId, activityId: activity.id } }"
          >
            <div class="activity-summary">
              <strong>{{ activity.name }}</strong>
              <span
                >{{ activity.ministryCount }}
                {{
                  activity.ministryCount === 1
                    ? 'ministério participante'
                    : 'ministérios participantes'
                }}</span
              >
            </div>
            <div class="activity-list-meta">
              <AppStatusBadge tone="success">Ativa</AppStatusBadge>
              <span class="activity-list-action">Ver detalhes <AppIcon name="arrow" /></span>
            </div>
          </RouterLink>
        </li>
      </ul>
      <nav
        v-if="activities.pagination.totalPages > 1"
        class="activity-pagination"
        aria-label="Paginação de atividades"
      >
        <AppButton
          variant="secondary"
          :disabled="activities.pagination.page <= 1"
          @click="goToPage(activities.pagination.page - 1)"
          >Página anterior</AppButton
        >
        <p aria-live="polite">
          Página {{ activities.pagination.page }} de {{ activities.pagination.totalPages }}
        </p>
        <AppButton
          variant="secondary"
          :disabled="activities.pagination.page >= activities.pagination.totalPages"
          @click="goToPage(activities.pagination.page + 1)"
          >Próxima página</AppButton
        >
      </nav>
    </section>
  </section>
</template>

<style src="./activities-page.css"></style>

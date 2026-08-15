<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppField, AppIcon, AppStatusBadge } from '@/shared/ui';
import { useMembersPage } from './use-members-page';

const props = defineProps<{ organizationId: string }>();
const {
  appliedSearch,
  applySearch,
  clearSearch,
  goToPage,
  load,
  loading,
  members,
  problem,
  registration,
  registrationOpen,
  search,
} = useMembersPage(toRef(props, 'organizationId'));
</script>

<template>
  <section class="page" aria-labelledby="members-title">
    <header class="page-heading page-heading-with-action">
      <div>
        <p class="eyebrow">Comunidade</p>
        <h1 id="members-title">Membros</h1>
        <p>Encontre e cadastre quem faz parte desta organização.</p>
      </div>
      <AppButton
        :variant="registrationOpen ? 'secondary' : 'primary'"
        :aria-expanded="registrationOpen"
        aria-controls="member-registration"
        @click="registrationOpen = !registrationOpen"
      >
        {{ registrationOpen ? 'Fechar formulário' : 'Cadastrar novo membro' }}
      </AppButton>
    </header>

    <form
      v-if="registrationOpen"
      id="member-registration"
      class="member-registration"
      aria-labelledby="member-registration-title"
      novalidate
      @submit.prevent="registration.register"
    >
      <fieldset :disabled="registration.registering.value">
        <legend id="member-registration-title">Cadastrar novo membro</legend>
        <p class="member-registration-description">
          Use o nome pelo qual o membro é reconhecido na comunidade.
        </p>
        <AppField
          id="member-name"
          v-model="registration.name.value"
          label="Nome do membro"
          :errors="registration.nameErrors.value"
          :maxlength="120"
        />
        <p
          v-if="registration.problem.value && registration.nameErrors.value.length === 0"
          class="form-error"
          role="alert"
        >
          {{ registration.problem.value.problem.title }}
        </p>
        <AppButton type="submit" :loading="registration.registering.value">
          Cadastrar membro
        </AppButton>
        <p class="status" aria-live="polite">
          {{ registration.registering.value ? 'Cadastrando membro.' : '' }}
        </p>
      </fieldset>
    </form>

    <form class="member-search" role="search" @submit.prevent="applySearch">
      <label for="member-search">Buscar membros</label>
      <div>
        <input id="member-search" v-model="search" type="search" maxlength="120" />
        <AppButton type="submit" variant="secondary">Buscar membros</AppButton>
      </div>
    </form>

    <p v-if="loading" class="route-status" role="status">Carregando membros…</p>
    <section v-else-if="problem" class="empty-state" aria-labelledby="members-error-title">
      <h2 id="members-error-title">{{ problem.problem.title }}</h2>
      <p>Você pode tentar carregar novamente sem perder o contexto desta página.</p>
      <AppButton variant="secondary" @click="load">Tentar novamente</AppButton>
    </section>
    <section
      v-else-if="members && members.items.length === 0 && appliedSearch"
      class="empty-state"
      aria-labelledby="member-search-empty-title"
    >
      <h2 id="member-search-empty-title">Nenhum membro encontrado</h2>
      <p>Revise o nome informado ou volte a visualizar todos os membros ativos.</p>
      <AppButton variant="secondary" @click="clearSearch">Limpar busca de membros</AppButton>
    </section>
    <section
      v-else-if="members && members.items.length === 0"
      class="empty-state"
      aria-labelledby="members-empty-title"
    >
      <h2 id="members-empty-title">A comunidade começa com seus membros</h2>
      <p>Cadastre o primeiro membro para construir os vínculos ministeriais da organização.</p>
      <AppButton @click="registrationOpen = true">Cadastrar primeiro membro</AppButton>
    </section>
    <section v-else-if="members" aria-labelledby="member-list-title">
      <div class="member-list-heading">
        <h2 id="member-list-title">
          {{ members.pagination.totalItems }}
          {{ members.pagination.totalItems === 1 ? 'membro ativo' : 'membros ativos' }}
        </h2>
      </div>
      <ul class="member-list">
        <li v-for="member in members.items" :key="member.id">
          <RouterLink
            class="member-list-link"
            :aria-label="`Ver perfil do membro ${member.name}`"
            :to="{
              name: 'member-details',
              params: { organizationId, memberId: member.id },
            }"
          >
            <div class="member-summary">
              <strong>{{ member.name }}</strong>
              <span>Membro da organização</span>
            </div>
            <div class="member-list-meta">
              <AppStatusBadge tone="success">Ativo</AppStatusBadge>
              <span class="member-list-action">
                Ver perfil
                <AppIcon name="arrow" />
              </span>
            </div>
          </RouterLink>
        </li>
      </ul>
      <nav
        v-if="members.pagination.totalPages > 1"
        class="member-pagination"
        aria-label="Paginação de membros"
      >
        <AppButton
          variant="secondary"
          :disabled="members.pagination.page <= 1"
          @click="goToPage(members.pagination.page - 1)"
        >
          Página anterior
        </AppButton>
        <p aria-live="polite">
          Página {{ members.pagination.page }} de {{ members.pagination.totalPages }}
        </p>
        <AppButton
          variant="secondary"
          :disabled="members.pagination.page >= members.pagination.totalPages"
          @click="goToPage(members.pagination.page + 1)"
        >
          Próxima página
        </AppButton>
      </nav>
    </section>
  </section>
</template>

<style src="./members-page.css"></style>

<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppField, AppIcon, AppStatusBadge } from '@/shared/ui';
import { useMinistryDetailsPage } from './use-ministry-details-page';

const props = defineProps<{ organizationId: string; ministryId: string }>();
const { load, loading, ministry, problem, roleDefinition, roleFormOpen } = useMinistryDetailsPage(
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
        Voltar para a lista de ministérios
      </RouterLink>
    </div>
  </section>
  <article v-else-if="ministry" class="ministry-details" aria-labelledby="ministry-title">
    <nav class="ministry-details-navigation" aria-label="Navegação do ministério">
      <RouterLink
        class="ministry-back-link app-button app-button-secondary"
        :to="{ name: 'organization-ministries', params: { organizationId } }"
      >
        <AppIcon name="back" />
        <span>Voltar para a lista de ministérios</span>
      </RouterLink>
    </nav>
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
        <div class="ministry-role-actions">
          <span>
            {{ ministry.roles.length }}
            {{ ministry.roles.length === 1 ? 'função' : 'funções' }}
          </span>
          <AppButton
            :variant="roleFormOpen ? 'secondary' : 'primary'"
            :aria-expanded="roleFormOpen"
            aria-controls="ministry-role-form"
            @click="roleFormOpen = !roleFormOpen"
          >
            {{ roleFormOpen ? 'Fechar formulário' : 'Adicionar função ministerial' }}
          </AppButton>
        </div>
      </header>
      <form
        v-if="roleFormOpen"
        id="ministry-role-form"
        class="ministry-role-form"
        aria-labelledby="ministry-role-form-title"
        novalidate
        @submit.prevent="roleDefinition.defineRole"
      >
        <fieldset :disabled="roleDefinition.defining.value">
          <legend id="ministry-role-form-title">Criar função ministerial</legend>
          <p class="ministry-role-form-description">
            Informe como essa responsabilidade é reconhecida pelas pessoas do ministério.
          </p>
          <AppField
            id="ministry-role-name"
            v-model="roleDefinition.name.value"
            label="Nome da função ministerial"
            :errors="roleDefinition.nameErrors.value"
            :maxlength="120"
          />
          <p
            v-if="roleDefinition.problem.value && roleDefinition.nameErrors.value.length === 0"
            class="form-error"
            role="alert"
          >
            {{ roleDefinition.problem.value.problem.title }}
          </p>
          <AppButton type="submit" :loading="roleDefinition.defining.value">
            Criar função ministerial
          </AppButton>
          <p class="status" aria-live="polite">
            {{ roleDefinition.defining.value ? 'Criando função ministerial.' : '' }}
          </p>
        </fieldset>
      </form>
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

<style src="./ministry-details-page.css"></style>

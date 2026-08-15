<script setup lang="ts">
import { toRef } from 'vue';
import { AppIcon, AppStatusBadge } from '@/shared/ui';
import { useOrganizationLayout } from './use-organization-layout';

const props = defineProps<{ organizationId: string }>();
const { load, loading, organization, problem } = useOrganizationLayout(
  toRef(props, 'organizationId'),
);
</script>

<template>
  <section v-if="loading" class="route-state" aria-live="polite">
    <p role="status">Carregando sua organização…</p>
  </section>
  <section v-else-if="problem" class="route-state" aria-labelledby="organization-error-title">
    <p class="eyebrow">Não foi possível continuar</p>
    <h1 id="organization-error-title">{{ problem.problem.title }}</h1>
    <button class="text-button" type="button" @click="load">Tentar novamente</button>
    <RouterLink :to="{ name: 'create-organization' }">Voltar ao início</RouterLink>
  </section>
  <div v-else-if="organization" class="organization-shell">
    <header class="organization-context">
      <span class="workspace-symbol" aria-hidden="true"><AppIcon name="community" /></span>
      <div>
        <small>Organização</small>
        <strong>{{ organization.name }}</strong>
      </div>
      <AppStatusBadge tone="success">Ativa</AppStatusBadge>
    </header>
    <div class="organization-workspace">
      <aside class="organization-sidebar">
        <nav aria-label="Navegação da organização">
          <ul class="organization-navigation">
            <li>
              <RouterLink
                :to="{ name: 'organization-home', params: { organizationId } }"
                exact-active-class="is-active"
              >
                Início
              </RouterLink>
            </li>
            <li>
              <RouterLink
                :to="{ name: 'organization-ministries', params: { organizationId } }"
                active-class="is-active"
              >
                Ministérios
              </RouterLink>
            </li>
            <li>
              <RouterLink
                :to="{ name: 'organization-members', params: { organizationId } }"
                active-class="is-active"
              >
                Membros
              </RouterLink>
            </li>
            <li>
              <RouterLink
                :to="{ name: 'organization-activities', params: { organizationId } }"
                active-class="is-active"
              >
                Atividades
              </RouterLink>
            </li>
          </ul>
        </nav>
      </aside>
      <div class="organization-content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style src="./organization-layout.css"></style>

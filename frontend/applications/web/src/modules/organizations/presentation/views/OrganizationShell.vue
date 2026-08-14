<script setup lang="ts">
import { toRef } from 'vue';
import { AppIcon, AppStatusBadge } from '@/shared/ui';
import { useOrganizationShell } from './use-organization-shell';

const props = defineProps<{ organizationId: string }>();
const { load, loading, organization, problem } = useOrganizationShell(
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
    <aside class="organization-sidebar">
      <header class="organization-context">
        <span class="workspace-symbol" aria-hidden="true"><AppIcon name="community" /></span>
        <div>
          <small>Organização</small>
          <strong>{{ organization.name }}</strong>
        </div>
        <AppStatusBadge tone="success">Ativa</AppStatusBadge>
      </header>
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
        </ul>
      </nav>
    </aside>
    <div class="organization-content">
      <RouterView />
    </div>
  </div>
</template>

<style src="./organization-shell.css"></style>

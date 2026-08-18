<script setup lang="ts">
import { AppIcon } from '@/shared/ui';
import { useAccessibleOrganizationsPage } from './use-accessible-organizations-page';

const { load, loading, organizations, problem } = useAccessibleOrganizationsPage();
</script>

<template>
  <section class="organization-selector" aria-labelledby="page-title">
    <header class="selector-heading">
      <p class="eyebrow">Seu espaço no Servir</p>
      <h1 id="page-title">Escolha a igreja que você quer acessar</h1>
      <p>Você verá somente as comunidades em que possui acesso ativo.</p>
    </header>

    <p v-if="loading" class="route-state" role="status">Buscando suas igrejas...</p>

    <section v-else-if="problem" class="route-state" aria-labelledby="selector-error-title">
      <h2 id="selector-error-title">Não conseguimos carregar suas igrejas</h2>
      <p>{{ problem.problem.title }}</p>
      <button class="selector-retry" type="button" @click="load">Tentar carregar novamente</button>
    </section>

    <section
      v-else-if="organizations.length === 0"
      class="selector-empty"
      aria-labelledby="selector-empty-title"
    >
      <span class="selector-symbol" aria-hidden="true"><AppIcon name="community" /></span>
      <h2 id="selector-empty-title">Você ainda não participa de uma igreja no Servir</h2>
      <p>Crie o espaço da sua comunidade ou aguarde um convite de um administrador.</p>
      <RouterLink class="selector-primary-action" :to="{ name: 'create-organization' }">
        Criar o espaço da minha igreja
        <AppIcon name="arrow" />
      </RouterLink>
    </section>

    <ul v-else class="organization-options" aria-label="Igrejas disponíveis">
      <li v-for="organization in organizations" :key="organization.id">
        <RouterLink
          class="organization-option"
          :to="{ name: 'organization-home', params: { organizationId: organization.id } }"
        >
          <span class="organization-option-icon" aria-hidden="true">
            <AppIcon name="community" />
          </span>
          <span>
            <strong>{{ organization.name }}</strong>
            <small>Acessar esta igreja</small>
          </span>
          <AppIcon name="arrow" />
        </RouterLink>
      </li>
    </ul>

    <RouterLink
      v-if="!loading && !problem && organizations.length > 0"
      class="selector-secondary-action"
      :to="{ name: 'create-organization' }"
    >
      Cadastrar outra igreja
    </RouterLink>
  </section>
</template>

<style src="./accessible-organizations-page.css"></style>

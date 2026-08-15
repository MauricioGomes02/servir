<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppIcon, AppStatusBadge } from '@/shared/ui';
import { useActivityDetailsPage } from './use-activity-details-page';

const props = defineProps<{ organizationId: string; activityId: string }>();
const { activity, load, loading, problem } = useActivityDetailsPage(
  toRef(props, 'organizationId'),
  toRef(props, 'activityId'),
);
</script>

<template>
  <section v-if="loading" class="activity-details-state" aria-live="polite">
    <p role="status">Carregando atividade…</p>
  </section>
  <section
    v-else-if="problem"
    class="activity-details-state"
    aria-labelledby="activity-details-error-title"
  >
    <p class="eyebrow">Não foi possível continuar</p>
    <h1 id="activity-details-error-title">{{ problem.problem.title }}</h1>
    <p>Você pode tentar novamente ou voltar para a lista de atividades.</p>
    <div class="activity-details-actions">
      <AppButton variant="secondary" @click="load">Tentar novamente</AppButton>
      <RouterLink
        :to="{ name: 'organization-activities', params: { organizationId } }"
        class="app-button app-button-tertiary"
        >Voltar para a lista de atividades</RouterLink
      >
    </div>
  </section>
  <article v-else-if="activity" class="activity-details" aria-labelledby="activity-title">
    <nav class="activity-details-navigation" aria-label="Navegação da atividade">
      <RouterLink
        class="activity-back-link app-button app-button-secondary"
        :to="{ name: 'organization-activities', params: { organizationId } }"
      >
        <AppIcon name="back" />
        <span>Voltar para a lista de atividades</span>
      </RouterLink>
    </nav>
    <header class="activity-details-header">
      <div>
        <p class="eyebrow">Atividade da comunidade</p>
        <h1 id="activity-title">{{ activity.name }}</h1>
        <p>Contexto para organizar ocorrências e, posteriormente, as pessoas que servirão.</p>
      </div>
      <AppStatusBadge :tone="activity.status === 'active' ? 'success' : 'neutral'">{{
        activity.status === 'active' ? 'Ativa' : 'Inativa'
      }}</AppStatusBadge>
    </header>
    <section class="activity-participants" aria-labelledby="activity-participants-title">
      <div>
        <p class="eyebrow">Participação</p>
        <h2 id="activity-participants-title">Ministérios envolvidos</h2>
      </div>
      <ul>
        <li v-for="ministry in activity.ministries" :key="ministry.id">
          <RouterLink
            :to="{ name: 'ministry-details', params: { organizationId, ministryId: ministry.id } }"
            >{{ ministry.name }} <AppIcon name="arrow"
          /></RouterLink>
        </li>
      </ul>
    </section>
  </article>
</template>

<style src="./activity-details-page.css"></style>

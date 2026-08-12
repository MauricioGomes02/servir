<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Organization } from '../../application/organization';
import { getOrganizationDetails } from '../../composition';
import { HttpProblem } from '@/shared/http/problem-details';
import AppFeatureCard from '@/shared/presentation/components/AppFeatureCard.vue';
import AppIcon from '@/shared/presentation/components/AppIcon.vue';
import AppStatusBadge from '@/shared/presentation/components/AppStatusBadge.vue';

const props = defineProps<{ organizationId: string }>();
const organization = ref<Organization>();
const problem = ref<HttpProblem>();
const loading = ref(true);
const abortController = new AbortController();

onMounted(async () => {
  try {
    organization.value = await getOrganizationDetails.execute(
      props.organizationId,
      abortController.signal,
    );
  } catch (error) {
    if (!abortController.signal.aborted) {
      problem.value =
        error instanceof HttpProblem
          ? error
          : new HttpProblem({
              type: 'about:blank',
              title: 'Não foi possível carregar a organização.',
              status: 0,
            });
    }
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => abortController.abort());
</script>

<template>
  <section class="workspace" aria-labelledby="workspace-title">
    <p v-if="loading" class="status" role="status">Carregando organização…</p>
    <div v-else-if="problem" class="empty-state" role="alert">
      <p class="eyebrow">Não foi possível continuar</p>
      <h1 id="workspace-title">{{ problem.problem.title }}</h1>
      <RouterLink :to="{ name: 'create-organization' }">Voltar ao início</RouterLink>
    </div>
    <template v-else-if="organization">
      <nav class="breadcrumb" aria-label="Navegação estrutural">
        <RouterLink :to="{ name: 'create-organization' }">Início</RouterLink
        ><span aria-hidden="true">/</span><span>Organização</span>
      </nav>
      <header class="workspace-heading">
        <div>
          <span class="workspace-symbol" aria-hidden="true"><AppIcon name="community" /></span>
          <p class="eyebrow">Sua comunidade</p>
          <h1 id="workspace-title">{{ organization.name }}</h1>
          <p>Um lugar para organizar quem serve, onde serve e quando a comunidade se reúne.</p>
        </div>
        <AppStatusBadge tone="success">Organização ativa</AppStatusBadge>
      </header>
      <section class="workspace-section" aria-labelledby="areas-title">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Tudo em um só lugar</p>
            <h2 id="areas-title">Áreas da organização</h2>
          </div>
          <p>Comece pelo que sua comunidade precisa agora.</p>
        </header>
        <nav aria-label="Áreas da organização">
          <ul class="feature-grid">
            <li>
              <AppFeatureCard
                title="Membros"
                description="Cadastre e acompanhe as pessoas da comunidade."
                icon="people"
              />
            </li>
            <li>
              <AppFeatureCard
                title="Ministérios"
                description="Organize funções, participantes e times."
                icon="ministry"
              />
            </li>
            <li>
              <AppFeatureCard
                title="Atividades"
                description="Planeje encontros e suas ocorrências."
                icon="calendar"
              />
            </li>
          </ul>
        </nav>
      </section>
    </template>
  </section>
</template>

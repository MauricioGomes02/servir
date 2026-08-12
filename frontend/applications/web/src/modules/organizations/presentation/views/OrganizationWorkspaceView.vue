<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Organization } from '../../application/organization';
import { getOrganizationDetails } from '../../composition';
import { HttpProblem } from '@/shared/http/problem-details';

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
      <header class="workspace-heading">
        <div>
          <p class="eyebrow">Sua comunidade</p>
          <h1 id="workspace-title">{{ organization.name }}</h1>
          <p>O espaço está pronto. Os próximos módulos serão conectados a esta organização.</p>
        </div>
        <span class="status-pill">Ativa</span>
      </header>
      <nav aria-label="Áreas da organização">
        <ul class="feature-grid">
          <li>
            <article>
              <h2>Membros</h2>
              <p>Cadastre e acompanhe as pessoas da comunidade.</p>
            </article>
          </li>
          <li>
            <article>
              <h2>Ministérios</h2>
              <p>Organize funções, participantes e times.</p>
            </article>
          </li>
          <li>
            <article>
              <h2>Atividades</h2>
              <p>Planeje encontros e suas ocorrências.</p>
            </article>
          </li>
        </ul>
      </nav>
    </template>
  </section>
</template>

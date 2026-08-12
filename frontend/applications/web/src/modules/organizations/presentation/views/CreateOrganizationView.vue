<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createOrganization } from '../../composition';
import { fieldErrors, HttpProblem } from '@/shared/http/problem-details';

const router = useRouter();
const name = ref('');
const submitting = ref(false);
const problem = ref<HttpProblem>();
const nameErrors = computed(() =>
  problem.value ? fieldErrors(problem.value.problem, 'name') : [],
);

async function submit(): Promise<void> {
  problem.value = undefined;
  submitting.value = true;
  try {
    const organization = await createOrganization.execute(name.value);
    await router.push({
      name: 'organization-workspace',
      params: { organizationId: organization.id },
    });
  } catch (error) {
    problem.value =
      error instanceof HttpProblem
        ? error
        : new HttpProblem({
            type: 'about:blank',
            title: 'Não foi possível conectar à API.',
            status: 0,
          });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="hero" aria-labelledby="page-title">
    <div class="hero-copy">
      <p class="eyebrow">Comece por sua comunidade</p>
      <h1 id="page-title">Organize o cuidado. Simplifique a escala.</h1>
      <p class="lead">
        Crie o espaço da sua igreja para conectar pessoas, ministérios e atividades com clareza.
      </p>
    </div>

    <form class="form-card" novalidate @submit.prevent="submit">
      <fieldset :disabled="submitting">
        <legend>Crie sua organização</legend>
        <p class="form-intro">Você poderá adicionar membros e ministérios no próximo passo.</p>

        <label for="organization-name">Nome da igreja ou comunidade</label>
        <input
          id="organization-name"
          v-model="name"
          name="name"
          type="text"
          autocomplete="organization"
          maxlength="120"
          required
          :aria-invalid="nameErrors.length > 0"
          :aria-describedby="nameErrors.length > 0 ? 'organization-name-errors' : undefined"
        />
        <ul v-if="nameErrors.length" id="organization-name-errors" class="field-errors">
          <li v-for="error in nameErrors" :key="error">{{ error }}</li>
        </ul>

        <p v-if="problem && nameErrors.length === 0" class="form-error" role="alert">
          {{ problem.problem.title }}
          <small v-if="problem.problem.correlationId">
            Referência: {{ problem.problem.correlationId }}
          </small>
        </p>

        <button type="submit">
          <span v-if="submitting">Criando…</span>
          <span v-else>Criar organização</span>
        </button>
        <p class="status" aria-live="polite">
          {{ submitting ? 'Criando sua organização.' : '' }}
        </p>
      </fieldset>
    </form>
  </section>
</template>

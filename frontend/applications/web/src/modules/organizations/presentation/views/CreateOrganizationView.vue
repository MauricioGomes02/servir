<script setup lang="ts">
import AppButton from '@/shared/presentation/components/AppButton.vue';
import AppField from '@/shared/presentation/components/AppField.vue';
import AppIcon from '@/shared/presentation/components/AppIcon.vue';
import { useCreateOrganizationView } from './use-create-organization-view';

const { name, nameErrors, problem, submit, submitting } = useCreateOrganizationView();
</script>

<template>
  <section class="hero" aria-labelledby="page-title">
    <div class="hero-copy">
      <span class="hero-symbol" aria-hidden="true"><AppIcon name="community" /></span>
      <p class="eyebrow">Tecnologia a serviço de pessoas</p>
      <h1 id="page-title">Mais tempo para cuidar da sua comunidade.</h1>
      <p class="lead">
        Reúna pessoas, ministérios e atividades em um espaço simples, acolhedor e feito para a
        rotina da sua igreja.
      </p>
      <ul class="benefit-list" aria-label="Benefícios">
        <li>Organização sem perder a proximidade</li>
        <li>Clareza para líderes e voluntários</li>
      </ul>
    </div>

    <form class="form-card" novalidate @submit.prevent="submit">
      <fieldset :disabled="submitting">
        <legend>Crie o espaço da sua igreja</legend>
        <p class="eyebrow">Primeiro passo</p>
        <p class="form-intro">Leva menos de um minuto. Você poderá configurar tudo com calma.</p>

        <AppField
          id="organization-name"
          v-model="name"
          label="Nome da igreja ou comunidade"
          :errors="nameErrors"
          :maxlength="120"
          autocomplete="organization"
        />

        <p v-if="problem && nameErrors.length === 0" class="form-error" role="alert">
          {{ problem.problem.title }}
          <small v-if="problem.problem.correlationId">
            Referência: {{ problem.problem.correlationId }}
          </small>
        </p>

        <AppButton type="submit" :loading="submitting">Criar minha organização</AppButton>
        <p class="status" aria-live="polite">
          {{ submitting ? 'Criando sua organização.' : '' }}
        </p>
      </fieldset>
    </form>
  </section>
</template>

<style src="./create-organization-view.css"></style>

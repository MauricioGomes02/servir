<script setup lang="ts">
defineProps<{ organizationId: string }>();
</script>

<template>
  <section class="page" aria-labelledby="home-title">
    <header class="page-heading">
      <p class="eyebrow">Início</p>
      <h1 id="home-title">O que precisa da sua atenção?</h1>
      <p>
        Conforme atividades, disponibilidade e escalas entrarem na rotina, suas próximas ações
        aparecerão aqui.
      </p>
    </header>

    <section class="next-step" aria-labelledby="next-step-title">
      <div>
        <p class="eyebrow">Prepare sua estrutura</p>
        <h2 id="next-step-title">Organize primeiro os ministérios</h2>
        <p>
          Ministérios reúnem as funções, equipes e pessoas que depois participarão das atividades e
          escalas.
        </p>
      </div>
      <RouterLink
        class="app-button app-button-primary app-button-large"
        :to="{ name: 'organization-ministries', params: { organizationId } }"
      >
        Ver ministérios
      </RouterLink>
    </section>
  </section>
</template>

<style src="./organization-home-page.css"></style>

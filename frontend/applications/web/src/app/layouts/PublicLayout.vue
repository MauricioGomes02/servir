<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <main id="main-content" class="public-layout" tabindex="-1">
    <div class="public-brand" aria-label="Servir">
      <span class="brand-mark" aria-hidden="true">S</span>
      <strong>Servir</strong>
    </div>
    <RouterView />
  </main>
</template>

<style src="../app.css"></style>

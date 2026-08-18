<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/shared/auth';
import { googleLoginUrl } from '@/features/sign-in';
import { useI18n } from '@/shared/i18n';

const route = useRoute();
const session = useSessionStore();
const { t } = useI18n();

const returnPath = computed(() => {
  const candidate = route.query.returnPath;
  return typeof candidate === 'string' && candidate.startsWith('/') && !candidate.startsWith('//')
    ? candidate
    : '/';
});
const loginUrl = computed(() => googleLoginUrl(returnPath.value));

onMounted(() => session.load());
</script>

<template>
  <section class="sign-in-page" aria-labelledby="sign-in-title">
    <div class="sign-in-copy">
      <p class="eyebrow">{{ t('auth.sign_in.eyebrow') }}</p>
      <h1 id="sign-in-title">{{ t('auth.sign_in.title') }}</h1>
      <p>{{ t('auth.sign_in.description') }}</p>
    </div>

    <p v-if="session.loading.value" role="status">{{ t('auth.sign_in.loading') }}</p>
    <p v-else-if="session.problem.value" role="alert">{{ t('auth.sign_in.unavailable') }}</p>
    <a v-else class="google-sign-in" :href="loginUrl">
      <span class="google-mark" aria-hidden="true">G</span>
      {{ t('auth.sign_in.google') }}
    </a>
  </section>
</template>

<style src="./sign-in-page.css"></style>

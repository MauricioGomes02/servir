<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/shared/auth';
import { useI18n } from '@/shared/i18n';
import { signOut } from './sign-out';

const router = useRouter();
const session = useSessionStore();
const { t } = useI18n();
const submitting = ref(false);
const failed = ref(false);

async function submit(): Promise<void> {
  failed.value = false;
  submitting.value = true;
  try {
    await signOut();
    session.clear();
    await router.replace({ name: 'sign-in' });
  } catch {
    failed.value = true;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <button class="sign-out-button" type="button" :disabled="submitting" @click="submit">
    {{ submitting ? t('auth.sign_out.loading') : t('auth.sign_out.action') }}
  </button>
  <p v-if="failed" class="sign-out-error" role="alert">
    {{ t('auth.sign_out.unavailable') }}
  </p>
</template>

<style src="./sign-out-button.css"></style>

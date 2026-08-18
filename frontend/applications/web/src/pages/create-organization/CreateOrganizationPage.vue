<script setup lang="ts">
import { AppButton, AppField, AppIcon } from '@/shared/ui';
import { useCreateOrganization } from '@/features/create-organization';
import { useLocalizedMessages } from '@/shared/i18n';
import { createOrganizationPageMessages } from './create-organization.messages';

const { name, nameErrors, problem, submit, submitting } = useCreateOrganization();
const { t } = useLocalizedMessages(createOrganizationPageMessages);
</script>

<template>
  <section class="hero" aria-labelledby="page-title">
    <RouterLink class="create-organization-back" :to="{ name: 'accessible-organizations' }">
      <AppIcon name="back" />
      <span>{{ t('back') }}</span>
    </RouterLink>
    <div class="hero-copy">
      <span class="hero-symbol" aria-hidden="true"><AppIcon name="community" /></span>
      <p class="eyebrow">{{ t('eyebrow') }}</p>
      <h1 id="page-title">{{ t('title') }}</h1>
      <p class="lead">{{ t('lead') }}</p>
      <ul class="benefit-list" :aria-label="t('benefits')">
        <li>{{ t('benefitProximity') }}</li>
        <li>{{ t('benefitClarity') }}</li>
      </ul>
    </div>

    <form class="form-card" novalidate @submit.prevent="submit">
      <fieldset :disabled="submitting">
        <legend>{{ t('legend') }}</legend>
        <p class="eyebrow">{{ t('firstStep') }}</p>
        <p class="form-intro">{{ t('intro') }}</p>

        <AppField
          id="organization-name"
          v-model="name"
          :label="t('name')"
          :errors="nameErrors"
          :maxlength="120"
          autocomplete="organization"
        />

        <p v-if="problem && nameErrors.length === 0" class="form-error" role="alert">
          {{ problem.problem.title }}
          <small v-if="problem.problem.correlationId">
            {{ t('reference') }}: {{ problem.problem.correlationId }}
          </small>
        </p>

        <AppButton type="submit" :loading="submitting">{{ t('submit') }}</AppButton>
        <p class="status" aria-live="polite">
          {{ submitting ? t('submitting') : '' }}
        </p>
      </fieldset>
    </form>
  </section>
</template>

<style src="./create-organization-page.css"></style>

<script setup lang="ts">
import { AppIcon } from '@/shared/ui';
import { useLocalizedMessages } from '@/shared/i18n';
import { accessibleOrganizationsMessages } from './accessible-organizations.messages';
import { useAccessibleOrganizationsPage } from './use-accessible-organizations-page';

const { load, loading, organizations, problem } = useAccessibleOrganizationsPage();
const { t } = useLocalizedMessages(accessibleOrganizationsMessages);
</script>

<template>
  <main id="main-content" class="organization-selector" tabindex="-1" aria-labelledby="page-title">
    <header class="selector-heading">
      <p class="eyebrow">{{ t('eyebrow') }}</p>
      <h1 id="page-title">{{ t('title') }}</h1>
      <p>{{ t('description') }}</p>
    </header>

    <p v-if="loading" class="route-state" role="status">{{ t('loading') }}</p>

    <section v-else-if="problem" class="route-state" aria-labelledby="selector-error-title">
      <h2 id="selector-error-title">{{ t('errorTitle') }}</h2>
      <p>{{ problem.problem.title }}</p>
      <button class="selector-retry" type="button" @click="load">{{ t('retry') }}</button>
    </section>

    <section
      v-else-if="organizations.length === 0"
      class="selector-empty"
      aria-labelledby="selector-empty-title"
    >
      <span class="selector-symbol" aria-hidden="true"><AppIcon name="community" /></span>
      <h2 id="selector-empty-title">{{ t('emptyTitle') }}</h2>
      <p>{{ t('emptyDescription') }}</p>
      <RouterLink class="selector-primary-action" :to="{ name: 'create-organization' }">
        {{ t('create') }}
        <AppIcon name="arrow" />
      </RouterLink>
    </section>

    <ul v-else class="organization-options" :aria-label="t('available')">
      <li v-for="organization in organizations" :key="organization.id">
        <RouterLink
          class="organization-option"
          :to="{ name: 'organization-home', params: { organizationId: organization.id } }"
        >
          <span class="organization-option-icon" aria-hidden="true">
            <AppIcon name="community" />
          </span>
          <span>
            <strong>{{ organization.name }}</strong>
            <small>{{ t('access') }}</small>
          </span>
          <AppIcon name="arrow" />
        </RouterLink>
      </li>
    </ul>

    <RouterLink
      v-if="!loading && !problem && organizations.length > 0"
      class="selector-secondary-action"
      :to="{ name: 'create-organization' }"
    >
      {{ t('another') }}
      <AppIcon name="arrow" />
    </RouterLink>
  </main>
</template>

<style src="./accessible-organizations-page.css"></style>

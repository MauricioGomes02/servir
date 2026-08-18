<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppField, AppIcon, AppStatusBadge } from '@/shared/ui';
import { useLocalizedMessages } from '@/shared/i18n';
import { ministriesMessages } from './ministries.messages';
import { useMinistriesPage } from './use-ministries-page';

const props = defineProps<{ organizationId: string }>();
const {
  appliedSearch,
  applySearch,
  clearSearch,
  createMinistry,
  creating,
  creationProblem,
  load,
  loading,
  name,
  nameErrors,
  page,
  problem,
  search,
  showCreation,
} = useMinistriesPage(toRef(props, 'organizationId'));
const { t } = useLocalizedMessages(ministriesMessages);
</script>

<template>
  <section class="page" aria-labelledby="ministries-title">
    <header class="page-heading page-heading-with-action">
      <div>
        <p class="eyebrow">{{ t('eyebrow') }}</p>
        <h1 id="ministries-title">{{ t('title') }}</h1>
        <p>{{ t('description') }}</p>
      </div>
      <AppButton
        :variant="showCreation ? 'secondary' : 'primary'"
        :aria-expanded="showCreation"
        aria-controls="ministry-creation"
        @click="showCreation = !showCreation"
      >
        {{ showCreation ? t('closeForm') : t('newMinistry') }}
      </AppButton>
    </header>

    <form
      v-if="showCreation"
      id="ministry-creation"
      class="inline-form"
      aria-labelledby="ministry-creation-title"
      novalidate
      @submit.prevent="createMinistry"
    >
      <fieldset :disabled="creating">
        <legend id="ministry-creation-title">{{ t('createTitle') }}</legend>
        <p>{{ t('createDescription') }}</p>
        <AppField
          id="ministry-name"
          v-model="name"
          :label="t('name')"
          :errors="nameErrors"
          :maxlength="120"
        />
        <p v-if="creationProblem && nameErrors.length === 0" class="form-error" role="alert">
          {{ creationProblem.problem.title }}
        </p>
        <AppButton type="submit" :loading="creating">{{ t('create') }}</AppButton>
        <p class="status" aria-live="polite">{{ creating ? t('creating') : '' }}</p>
      </fieldset>
    </form>

    <form class="search-bar" role="search" @submit.prevent="applySearch">
      <label for="ministry-search">{{ t('searchLabel') }}</label>
      <div>
        <input id="ministry-search" v-model="search" type="search" maxlength="120" />
        <AppButton type="submit" variant="secondary">{{ t('search') }}</AppButton>
      </div>
    </form>

    <p v-if="loading" class="route-status" role="status">{{ t('loading') }}</p>
    <section v-else-if="problem" class="empty-state" aria-labelledby="ministries-error-title">
      <h2 id="ministries-error-title">{{ problem.problem.title }}</h2>
      <p>{{ t('retryDescription') }}</p>
      <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
    </section>
    <section
      v-else-if="page && page.items.length === 0 && appliedSearch"
      class="empty-state"
      aria-labelledby="search-empty-title"
    >
      <h2 id="search-empty-title">{{ t('noResult') }}</h2>
      <p>{{ t('noResultDescription') }}</p>
      <AppButton variant="secondary" @click="clearSearch">{{ t('clearSearch') }}</AppButton>
    </section>
    <section
      v-else-if="page && page.items.length === 0"
      class="empty-state"
      aria-labelledby="ministries-empty-title"
    >
      <h2 id="ministries-empty-title">{{ t('emptyTitle') }}</h2>
      <p>{{ t('emptyDescription') }}</p>
      <AppButton @click="showCreation = true">{{ t('createFirst') }}</AppButton>
    </section>
    <section v-else-if="page" aria-labelledby="ministry-list-title">
      <div class="list-heading">
        <h2 id="ministry-list-title">
          {{ page.pagination.totalItems }}
          {{ page.pagination.totalItems === 1 ? t('activeSingular') : t('activePlural') }}
        </h2>
      </div>
      <ul class="ministry-list">
        <li v-for="ministry in page.items" :key="ministry.id">
          <RouterLink
            class="ministry-list-link"
            :aria-label="`${t('detailsPrefix')} ${ministry.name}`"
            :to="{
              name: 'ministry-details',
              params: { organizationId, ministryId: ministry.id },
            }"
          >
            <div class="ministry-summary">
              <strong>{{ ministry.name }}</strong>
              <span>{{ t('summary') }}</span>
            </div>
            <div class="ministry-list-meta">
              <AppStatusBadge tone="success">{{ t('active') }}</AppStatusBadge>
              <span class="ministry-list-action">
                {{ t('details') }}
                <AppIcon name="arrow" />
              </span>
            </div>
          </RouterLink>
        </li>
      </ul>
    </section>
  </section>
</template>

<style src="./ministries-page.css"></style>

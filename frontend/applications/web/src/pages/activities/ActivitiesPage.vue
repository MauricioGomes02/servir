<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppField, AppIcon, AppStatusBadge } from '@/shared/ui';
import { useLocalizedMessages } from '@/shared/i18n';
import { activitiesMessages } from './activities.messages';
import { useActivitiesPage } from './use-activities-page';

const props = defineProps<{ organizationId: string }>();
const {
  activities,
  appliedSearch,
  applySearch,
  clearSearch,
  creation,
  creationOpen,
  goToPage,
  load,
  loading,
  ministries,
  problem,
  search,
} = useActivitiesPage(toRef(props, 'organizationId'));
const { t } = useLocalizedMessages(activitiesMessages);
</script>

<template>
  <section class="page" aria-labelledby="activities-title">
    <header class="page-heading page-heading-with-action">
      <div>
        <p class="eyebrow">{{ t('eyebrow') }}</p>
        <h1 id="activities-title">{{ t('title') }}</h1>
        <p>{{ t('description') }}</p>
      </div>
      <AppButton
        :variant="creationOpen ? 'secondary' : 'primary'"
        :aria-expanded="creationOpen"
        aria-controls="activity-creation"
        @click="creationOpen = !creationOpen"
      >
        {{ creationOpen ? t('closeForm') : t('plan') }}
      </AppButton>
    </header>

    <form
      v-if="creationOpen"
      id="activity-creation"
      class="activity-creation"
      aria-labelledby="activity-creation-title"
      novalidate
      @submit.prevent="creation.create"
    >
      <fieldset :disabled="creation.creating.value">
        <legend id="activity-creation-title">{{ t('plan') }}</legend>
        <p>{{ t('createDescription') }}</p>
        <AppField
          id="activity-name"
          v-model="creation.name.value"
          :label="t('name')"
          :errors="creation.nameErrors.value"
          :maxlength="120"
        />
        <fieldset
          class="activity-ministries"
          :aria-describedby="
            creation.ministryErrors.value.length ? 'activity-ministries-error' : undefined
          "
        >
          <legend>{{ t('participantMinistries') }}</legend>
          <p v-if="ministries.length === 0">
            {{ t('ministryRequired') }}
          </p>
          <label
            v-for="ministry in ministries"
            :key="ministry.id"
            :for="`activity-ministry-${ministry.id}`"
          >
            <input
              :id="`activity-ministry-${ministry.id}`"
              v-model="creation.ministryIds.value"
              type="checkbox"
              :value="ministry.id"
            />
            <span>{{ ministry.name }}</span>
          </label>
          <ul
            v-if="creation.ministryErrors.value.length"
            id="activity-ministries-error"
            class="field-errors"
          >
            <li v-for="error in creation.ministryErrors.value" :key="error">{{ error }}</li>
          </ul>
        </fieldset>
        <p
          v-if="
            creation.problem.value &&
            creation.nameErrors.value.length === 0 &&
            creation.ministryErrors.value.length === 0
          "
          class="form-error"
          role="alert"
        >
          {{ creation.problem.value.problem.title }}
        </p>
        <AppButton
          type="submit"
          :loading="creation.creating.value"
          :disabled="ministries.length === 0"
        >
          {{ t('create') }}
        </AppButton>
      </fieldset>
    </form>

    <form class="activity-search" role="search" @submit.prevent="applySearch">
      <label for="activity-search">{{ t('search') }}</label>
      <div>
        <input id="activity-search" v-model="search" type="search" maxlength="120" />
        <AppButton type="submit" variant="secondary">{{ t('search') }}</AppButton>
      </div>
    </form>

    <p v-if="loading" class="route-status" role="status">{{ t('loading') }}</p>
    <section v-else-if="problem" class="empty-state" aria-labelledby="activities-error-title">
      <h2 id="activities-error-title">{{ problem.problem.title }}</h2>
      <p>{{ t('retryDescription') }}</p>
      <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
    </section>
    <section
      v-else-if="activities && activities.items.length === 0 && appliedSearch"
      class="empty-state"
      aria-labelledby="activity-search-empty-title"
    >
      <h2 id="activity-search-empty-title">{{ t('noResult') }}</h2>
      <p>{{ t('noResultDescription') }}</p>
      <AppButton variant="secondary" @click="clearSearch">{{ t('clearSearch') }}</AppButton>
    </section>
    <section
      v-else-if="activities && activities.items.length === 0"
      class="empty-state"
      aria-labelledby="activities-empty-title"
    >
      <h2 id="activities-empty-title">{{ t('emptyTitle') }}</h2>
      <p>{{ t('emptyDescription') }}</p>
      <AppButton :disabled="ministries.length === 0" @click="creationOpen = true">{{
        t('first')
      }}</AppButton>
    </section>
    <section v-else-if="activities" aria-labelledby="activity-list-title">
      <div class="activity-list-heading">
        <h2 id="activity-list-title">
          {{ activities.pagination.totalItems }}
          {{ activities.pagination.totalItems === 1 ? t('activeSingular') : t('activePlural') }}
        </h2>
      </div>
      <ul class="activity-list">
        <li v-for="activity in activities.items" :key="activity.id">
          <RouterLink
            class="activity-list-link"
            :aria-label="`${t('detailsPrefix')} ${activity.name}`"
            :to="{ name: 'activity-details', params: { organizationId, activityId: activity.id } }"
          >
            <div class="activity-summary">
              <strong>{{ activity.name }}</strong>
              <span
                >{{ activity.ministryCount }}
                {{
                  activity.ministryCount === 1 ? t('ministrySingular') : t('ministryPlural')
                }}</span
              >
            </div>
            <div class="activity-list-meta">
              <AppStatusBadge tone="success">{{ t('active') }}</AppStatusBadge>
              <span class="activity-list-action">{{ t('details') }} <AppIcon name="arrow" /></span>
            </div>
          </RouterLink>
        </li>
      </ul>
      <nav
        v-if="activities.pagination.totalPages > 1"
        class="activity-pagination"
        :aria-label="t('pagination')"
      >
        <AppButton
          variant="secondary"
          :disabled="activities.pagination.page <= 1"
          @click="goToPage(activities.pagination.page - 1)"
          >{{ t('previous') }}</AppButton
        >
        <p aria-live="polite">
          {{ t('page') }} {{ activities.pagination.page }} {{ t('of') }}
          {{ activities.pagination.totalPages }}
        </p>
        <AppButton
          variant="secondary"
          :disabled="activities.pagination.page >= activities.pagination.totalPages"
          @click="goToPage(activities.pagination.page + 1)"
          >{{ t('next') }}</AppButton
        >
      </nav>
    </section>
  </section>
</template>

<style src="./activities-page.css"></style>

<script setup lang="ts">
import { toRef } from 'vue';
import {
  AppButton,
  AppField,
  AppFormSection,
  AppIcon,
  AppResourceList,
  AppResourceListItem,
  AppResourceSection,
  AppSearchField,
  AppStatusBadge,
} from '@/shared/ui';
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
        id="activity-creation-trigger"
        :variant="creationOpen ? 'secondary' : 'primary'"
        :aria-expanded="creationOpen"
        aria-controls="activity-creation"
        @click="creationOpen = !creationOpen"
      >
        {{ creationOpen ? t('closeForm') : t('plan') }}
      </AppButton>
    </header>

    <AppFormSection
      id="activity-creation"
      trigger-id="activity-creation-trigger"
      :open="creationOpen"
      :title="t('plan')"
      :description="t('createDescription')"
      :busy="creation.creating.value"
      @submit="creation.create"
    >
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
      <template #actions>
        <AppButton
          type="submit"
          :loading="creation.creating.value"
          :disabled="ministries.length === 0"
        >
          {{ t('create') }}
        </AppButton>
      </template>
    </AppFormSection>

    <AppResourceSection title-id="activity-list-title">
      <template #title>{{ t('collectionTitle') }}</template>
      <template v-if="activities" #summary>
        {{ activities.pagination.totalItems }}
        {{
          activities.pagination.totalItems === 1 ? t('registeredSingular') : t('registeredPlural')
        }}
      </template>
      <template v-if="activities && (activities.items.length > 0 || appliedSearch)" #controls>
        <AppSearchField
          id="activity-search"
          v-model="search"
          :label="t('search')"
          :clear-label="t('clearSearch')"
          :maxlength="120"
          @search="applySearch"
          @clear="clearSearch"
        />
      </template>

      <p v-if="loading" class="collection-status" role="status">{{ t('loading') }}</p>
      <section v-else-if="problem" class="empty-state" aria-labelledby="activities-error-title">
        <h3 id="activities-error-title">{{ problem.problem.title }}</h3>
        <p>{{ t('retryDescription') }}</p>
        <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
      </section>
      <section
        v-else-if="activities && activities.items.length === 0 && appliedSearch"
        class="empty-state"
        aria-labelledby="activity-search-empty-title"
      >
        <h3 id="activity-search-empty-title">{{ t('noResult') }}</h3>
        <p>{{ t('noResultDescription') }}</p>
      </section>
      <section
        v-else-if="activities && activities.items.length === 0"
        class="empty-state"
        aria-labelledby="activities-empty-title"
      >
        <h3 id="activities-empty-title">{{ t('emptyTitle') }}</h3>
        <p>{{ t('emptyDescription') }}</p>
        <AppButton :disabled="ministries.length === 0" @click="creationOpen = true">{{
          t('first')
        }}</AppButton>
      </section>
      <AppResourceList>
        <AppResourceListItem
          v-for="activity in activities?.items ?? []"
          :key="activity.id"
          :accessible-label="`${t('detailsPrefix')} ${activity.name}`"
          :to="{ name: 'activity-details', params: { organizationId, activityId: activity.id } }"
        >
          <template #primary>
            <strong>{{ activity.name }}</strong>
            <span
              >{{ activity.ministryCount }}
              {{ activity.ministryCount === 1 ? t('ministrySingular') : t('ministryPlural') }}</span
            >
          </template>
          <template #meta>
            <AppStatusBadge tone="success">{{ t('active') }}</AppStatusBadge>
          </template>
          <template #action>{{ t('details') }} <AppIcon name="arrow" /></template>
        </AppResourceListItem>
      </AppResourceList>
      <nav
        v-if="activities && activities.pagination.totalPages > 1"
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
    </AppResourceSection>
  </section>
</template>

<style src="./activities-page.css"></style>

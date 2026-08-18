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
        id="ministry-creation-trigger"
        :variant="showCreation ? 'secondary' : 'primary'"
        :aria-expanded="showCreation"
        aria-controls="ministry-creation"
        @click="showCreation = !showCreation"
      >
        {{ showCreation ? t('closeForm') : t('newMinistry') }}
      </AppButton>
    </header>

    <AppFormSection
      id="ministry-creation"
      trigger-id="ministry-creation-trigger"
      :open="showCreation"
      :title="t('createTitle')"
      :description="t('createDescription')"
      :busy="creating"
      @submit="createMinistry"
    >
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
      <template #actions>
        <AppButton type="submit" :loading="creating">{{ t('create') }}</AppButton>
        <p class="status" aria-live="polite">{{ creating ? t('creating') : '' }}</p>
      </template>
    </AppFormSection>

    <AppResourceSection title-id="ministry-list-title">
      <template #title>{{ t('collectionTitle') }}</template>
      <template v-if="page" #summary>
        {{ page.pagination.totalItems }}
        {{ page.pagination.totalItems === 1 ? t('registeredSingular') : t('registeredPlural') }}
      </template>
      <template v-if="page && (page.items.length > 0 || appliedSearch)" #controls>
        <AppSearchField
          id="ministry-search"
          v-model="search"
          :label="t('searchLabel')"
          :clear-label="t('clearSearch')"
          :maxlength="120"
          @search="applySearch"
          @clear="clearSearch"
        />
      </template>

      <p v-if="loading" class="collection-status" role="status">{{ t('loading') }}</p>
      <section v-else-if="problem" class="empty-state" aria-labelledby="ministries-error-title">
        <h3 id="ministries-error-title">{{ problem.problem.title }}</h3>
        <p>{{ t('retryDescription') }}</p>
        <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
      </section>
      <section
        v-else-if="page && page.items.length === 0 && appliedSearch"
        class="empty-state"
        aria-labelledby="search-empty-title"
      >
        <h3 id="search-empty-title">{{ t('noResult') }}</h3>
        <p>{{ t('noResultDescription') }}</p>
      </section>
      <section
        v-else-if="page && page.items.length === 0"
        class="empty-state"
        aria-labelledby="ministries-empty-title"
      >
        <h3 id="ministries-empty-title">{{ t('emptyTitle') }}</h3>
        <p>{{ t('emptyDescription') }}</p>
        <AppButton @click="showCreation = true">{{ t('createFirst') }}</AppButton>
      </section>
      <AppResourceList>
        <AppResourceListItem
          v-for="ministry in page?.items ?? []"
          :key="ministry.id"
          :accessible-label="`${t('detailsPrefix')} ${ministry.name}`"
          :to="{
            name: 'ministry-details',
            params: { organizationId, ministryId: ministry.id },
          }"
        >
          <template #primary>
            <strong>{{ ministry.name }}</strong>
            <span>{{ t('summary') }}</span>
          </template>
          <template #meta>
            <AppStatusBadge tone="success">{{ t('active') }}</AppStatusBadge>
          </template>
          <template #action>
            {{ t('details') }}
            <AppIcon name="arrow" />
          </template>
        </AppResourceListItem>
      </AppResourceList>
    </AppResourceSection>
  </section>
</template>

<style src="./ministries-page.css"></style>

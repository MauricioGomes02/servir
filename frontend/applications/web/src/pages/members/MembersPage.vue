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
import { membersMessages } from './members.messages';
import { useMembersPage } from './use-members-page';

const props = defineProps<{ organizationId: string }>();
const {
  appliedSearch,
  applySearch,
  clearSearch,
  goToPage,
  load,
  loading,
  members,
  problem,
  registration,
  registrationOpen,
  search,
} = useMembersPage(toRef(props, 'organizationId'));
const { t } = useLocalizedMessages(membersMessages);
</script>

<template>
  <section class="page" aria-labelledby="members-title">
    <header class="page-heading page-heading-with-action">
      <div>
        <p class="eyebrow">{{ t('eyebrow') }}</p>
        <h1 id="members-title">{{ t('title') }}</h1>
        <p>{{ t('description') }}</p>
      </div>
      <AppButton
        id="member-registration-trigger"
        :variant="registrationOpen ? 'secondary' : 'primary'"
        :aria-expanded="registrationOpen"
        aria-controls="member-registration"
        @click="registrationOpen = !registrationOpen"
      >
        {{ registrationOpen ? t('closeForm') : t('newMember') }}
      </AppButton>
    </header>

    <AppFormSection
      id="member-registration"
      trigger-id="member-registration-trigger"
      :open="registrationOpen"
      :title="t('newMember')"
      :description="t('registrationDescription')"
      :busy="registration.registering.value"
      @submit="registration.register"
    >
      <AppField
        id="member-name"
        v-model="registration.name.value"
        :label="t('name')"
        :errors="registration.nameErrors.value"
        :maxlength="120"
      />
      <p
        v-if="registration.problem.value && registration.nameErrors.value.length === 0"
        class="form-error"
        role="alert"
      >
        {{ registration.problem.value.problem.title }}
      </p>
      <template #actions>
        <AppButton type="submit" :loading="registration.registering.value">
          {{ t('register') }}
        </AppButton>
        <p class="status" aria-live="polite">
          {{ registration.registering.value ? t('registering') : '' }}
        </p>
      </template>
    </AppFormSection>

    <AppResourceSection title-id="member-list-title">
      <template #title>{{ t('collectionTitle') }}</template>
      <template v-if="members" #summary>
        {{ members.pagination.totalItems }}
        {{ members.pagination.totalItems === 1 ? t('registeredSingular') : t('registeredPlural') }}
      </template>
      <template v-if="members && (members.items.length > 0 || appliedSearch)" #controls>
        <AppSearchField
          id="member-search"
          v-model="search"
          :label="t('search')"
          :clear-label="t('clearSearch')"
          :maxlength="120"
          @search="applySearch"
          @clear="clearSearch"
        />
      </template>

      <p v-if="loading" class="collection-status" role="status">{{ t('loading') }}</p>
      <section v-else-if="problem" class="empty-state" aria-labelledby="members-error-title">
        <h3 id="members-error-title">{{ problem.problem.title }}</h3>
        <p>{{ t('retryDescription') }}</p>
        <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
      </section>
      <section
        v-else-if="members && members.items.length === 0 && appliedSearch"
        class="empty-state"
        aria-labelledby="member-search-empty-title"
      >
        <h3 id="member-search-empty-title">{{ t('noResult') }}</h3>
        <p>{{ t('noResultDescription') }}</p>
      </section>
      <section
        v-else-if="members && members.items.length === 0"
        class="empty-state"
        aria-labelledby="members-empty-title"
      >
        <h3 id="members-empty-title">{{ t('emptyTitle') }}</h3>
        <p>{{ t('emptyDescription') }}</p>
        <AppButton @click="registrationOpen = true">{{ t('firstMember') }}</AppButton>
      </section>
      <AppResourceList>
        <AppResourceListItem
          v-for="member in members?.items ?? []"
          :key="member.id"
          :accessible-label="`${t('profilePrefix')} ${member.name}`"
          :to="{
            name: 'member-details',
            params: { organizationId, memberId: member.id },
          }"
        >
          <template #primary>
            <strong>{{ member.name }}</strong>
            <span>{{ t('memberSummary') }}</span>
          </template>
          <template #meta>
            <AppStatusBadge tone="success">{{ t('active') }}</AppStatusBadge>
          </template>
          <template #action>{{ t('profile') }} <AppIcon name="arrow" /></template>
        </AppResourceListItem>
      </AppResourceList>
      <nav
        v-if="members && members.pagination.totalPages > 1"
        class="member-pagination"
        :aria-label="t('pagination')"
      >
        <AppButton
          variant="secondary"
          :disabled="members.pagination.page <= 1"
          @click="goToPage(members.pagination.page - 1)"
        >
          {{ t('previous') }}
        </AppButton>
        <p aria-live="polite">
          {{ t('page') }} {{ members.pagination.page }} {{ t('of') }}
          {{ members.pagination.totalPages }}
        </p>
        <AppButton
          variant="secondary"
          :disabled="members.pagination.page >= members.pagination.totalPages"
          @click="goToPage(members.pagination.page + 1)"
        >
          {{ t('next') }}
        </AppButton>
      </nav>
    </AppResourceSection>
  </section>
</template>

<style src="./members-page.css"></style>

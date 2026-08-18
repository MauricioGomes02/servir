<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppField, AppIcon, AppStatusBadge } from '@/shared/ui';
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
        :variant="registrationOpen ? 'secondary' : 'primary'"
        :aria-expanded="registrationOpen"
        aria-controls="member-registration"
        @click="registrationOpen = !registrationOpen"
      >
        {{ registrationOpen ? t('closeForm') : t('newMember') }}
      </AppButton>
    </header>

    <form
      v-if="registrationOpen"
      id="member-registration"
      class="member-registration"
      aria-labelledby="member-registration-title"
      novalidate
      @submit.prevent="registration.register"
    >
      <fieldset :disabled="registration.registering.value">
        <legend id="member-registration-title">{{ t('newMember') }}</legend>
        <p class="member-registration-description">
          {{ t('registrationDescription') }}
        </p>
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
        <AppButton type="submit" :loading="registration.registering.value">
          {{ t('register') }}
        </AppButton>
        <p class="status" aria-live="polite">
          {{ registration.registering.value ? t('registering') : '' }}
        </p>
      </fieldset>
    </form>

    <form class="member-search" role="search" @submit.prevent="applySearch">
      <label for="member-search">{{ t('search') }}</label>
      <div>
        <input id="member-search" v-model="search" type="search" maxlength="120" />
        <AppButton type="submit" variant="secondary">{{ t('search') }}</AppButton>
      </div>
    </form>

    <p v-if="loading" class="route-status" role="status">{{ t('loading') }}</p>
    <section v-else-if="problem" class="empty-state" aria-labelledby="members-error-title">
      <h2 id="members-error-title">{{ problem.problem.title }}</h2>
      <p>{{ t('retryDescription') }}</p>
      <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
    </section>
    <section
      v-else-if="members && members.items.length === 0 && appliedSearch"
      class="empty-state"
      aria-labelledby="member-search-empty-title"
    >
      <h2 id="member-search-empty-title">{{ t('noResult') }}</h2>
      <p>{{ t('noResultDescription') }}</p>
      <AppButton variant="secondary" @click="clearSearch">{{ t('clearSearch') }}</AppButton>
    </section>
    <section
      v-else-if="members && members.items.length === 0"
      class="empty-state"
      aria-labelledby="members-empty-title"
    >
      <h2 id="members-empty-title">{{ t('emptyTitle') }}</h2>
      <p>{{ t('emptyDescription') }}</p>
      <AppButton @click="registrationOpen = true">{{ t('firstMember') }}</AppButton>
    </section>
    <section v-else-if="members" aria-labelledby="member-list-title">
      <div class="member-list-heading">
        <h2 id="member-list-title">
          {{ members.pagination.totalItems }}
          {{ members.pagination.totalItems === 1 ? t('activeSingular') : t('activePlural') }}
        </h2>
      </div>
      <ul class="member-list">
        <li v-for="member in members.items" :key="member.id">
          <RouterLink
            class="member-list-link"
            :aria-label="`${t('profilePrefix')} ${member.name}`"
            :to="{
              name: 'member-details',
              params: { organizationId, memberId: member.id },
            }"
          >
            <div class="member-summary">
              <strong>{{ member.name }}</strong>
              <span>{{ t('memberSummary') }}</span>
            </div>
            <div class="member-list-meta">
              <AppStatusBadge tone="success">{{ t('active') }}</AppStatusBadge>
              <span class="member-list-action">
                {{ t('profile') }}
                <AppIcon name="arrow" />
              </span>
            </div>
          </RouterLink>
        </li>
      </ul>
      <nav
        v-if="members.pagination.totalPages > 1"
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
    </section>
  </section>
</template>

<style src="./members-page.css"></style>

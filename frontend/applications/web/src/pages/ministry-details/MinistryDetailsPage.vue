<script setup lang="ts">
import { toRef } from 'vue';
import {
  AppBackLink,
  AppButton,
  AppContentSection,
  AppDetailHeader,
  AppField,
  AppFormSection,
  AppRouteState,
  AppStatusBadge,
} from '@/shared/ui';
import { useLocalizedMessages } from '@/shared/i18n';
import { ministryDetailsMessages } from './ministry-details.messages';
import { useMinistryDetailsPage } from './use-ministry-details-page';

const props = defineProps<{ organizationId: string; ministryId: string }>();
const { load, loading, ministry, problem, roleDefinition, roleFormOpen } = useMinistryDetailsPage(
  toRef(props, 'organizationId'),
  toRef(props, 'ministryId'),
);
const { t } = useLocalizedMessages(ministryDetailsMessages);
</script>

<template>
  <AppRouteState v-if="loading" loading>
    <template #status>{{ t('loading') }}</template>
  </AppRouteState>
  <AppRouteState v-else-if="problem" title-id="ministry-details-error-title">
    <template #eyebrow>{{ t('cannotContinue') }}</template>
    <template #title>{{ problem.problem.title }}</template>
    <template #description>{{ t('errorDescription') }}</template>
    <template #actions>
      <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
      <RouterLink
        :to="{ name: 'organization-ministries', params: { organizationId } }"
        class="app-button app-button-tertiary"
      >
        {{ t('back') }}
      </RouterLink>
    </template>
  </AppRouteState>
  <article v-else-if="ministry" class="ministry-details" aria-labelledby="ministry-title">
    <nav class="app-back-navigation" :aria-label="t('navigation')">
      <AppBackLink :to="{ name: 'organization-ministries', params: { organizationId } }">
        {{ t('back') }}
      </AppBackLink>
    </nav>
    <AppDetailHeader title-id="ministry-title">
      <template #eyebrow>{{ t('eyebrow') }}</template>
      <template #title>{{ ministry.name }}</template>
      <template #description>{{ t('description') }}</template>
      <template #aside>
        <AppStatusBadge :tone="ministry.status === 'active' ? 'success' : 'neutral'">
          {{ ministry.status === 'active' ? t('active') : t('inactive') }}
        </AppStatusBadge>
      </template>
    </AppDetailHeader>

    <AppContentSection title-id="ministry-roles-title">
      <template #eyebrow>{{ t('serviceOrganization') }}</template>
      <template #title>{{ t('roles') }}</template>
      <template #actions>
        <span>
          {{ ministry.roles.length }}
          {{ ministry.roles.length === 1 ? t('roleSingular') : t('rolePlural') }}
        </span>
        <AppButton
          id="ministry-role-form-trigger"
          :variant="roleFormOpen ? 'secondary' : 'primary'"
          :aria-expanded="roleFormOpen"
          aria-controls="ministry-role-form"
          @click="roleFormOpen = !roleFormOpen"
        >
          {{ roleFormOpen ? t('closeForm') : t('addRole') }}
        </AppButton>
      </template>
      <AppFormSection
        id="ministry-role-form"
        trigger-id="ministry-role-form-trigger"
        :open="roleFormOpen"
        :title="t('createRole')"
        :description="t('roleDescription')"
        :busy="roleDefinition.defining.value"
        @submit="roleDefinition.defineRole"
      >
        <AppField
          id="ministry-role-name"
          v-model="roleDefinition.name.value"
          :label="t('roleName')"
          :errors="roleDefinition.nameErrors.value"
          :maxlength="120"
        />
        <p
          v-if="roleDefinition.problem.value && roleDefinition.nameErrors.value.length === 0"
          class="form-error"
          role="alert"
        >
          {{ roleDefinition.problem.value.problem.title }}
        </p>
        <template #actions>
          <AppButton type="submit" :loading="roleDefinition.defining.value">
            {{ t('createRole') }}
          </AppButton>
          <p class="status" aria-live="polite">
            {{ roleDefinition.defining.value ? t('creatingRole') : '' }}
          </p>
        </template>
      </AppFormSection>
      <p v-if="ministry.roles.length === 0" class="ministry-roles-empty">
        {{ t('noRoles') }}
      </p>
      <ul v-else>
        <li v-for="role in ministry.roles" :key="role.id">
          <strong>{{ role.name }}</strong>
          <AppStatusBadge :tone="role.status === 'active' ? 'success' : 'neutral'">
            {{ role.status === 'active' ? t('roleActive') : t('roleInactive') }}
          </AppStatusBadge>
        </li>
      </ul>
    </AppContentSection>
  </article>
</template>

<style src="./ministry-details-page.css"></style>

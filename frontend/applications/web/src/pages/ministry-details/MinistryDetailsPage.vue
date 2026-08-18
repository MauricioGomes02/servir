<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppField, AppIcon, AppStatusBadge } from '@/shared/ui';
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
  <section v-if="loading" class="ministry-details-state" aria-live="polite">
    <p role="status">{{ t('loading') }}</p>
  </section>
  <section
    v-else-if="problem"
    class="ministry-details-state"
    aria-labelledby="ministry-details-error-title"
  >
    <p class="eyebrow">{{ t('cannotContinue') }}</p>
    <h1 id="ministry-details-error-title">{{ problem.problem.title }}</h1>
    <p>{{ t('errorDescription') }}</p>
    <div class="ministry-details-actions">
      <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
      <RouterLink
        :to="{ name: 'organization-ministries', params: { organizationId } }"
        class="app-button app-button-tertiary"
      >
        {{ t('back') }}
      </RouterLink>
    </div>
  </section>
  <article v-else-if="ministry" class="ministry-details" aria-labelledby="ministry-title">
    <nav class="ministry-details-navigation" :aria-label="t('navigation')">
      <RouterLink
        class="ministry-back-link app-button app-button-secondary"
        :to="{ name: 'organization-ministries', params: { organizationId } }"
      >
        <AppIcon name="back" />
        <span>{{ t('back') }}</span>
      </RouterLink>
    </nav>
    <header class="ministry-details-header">
      <div>
        <p class="eyebrow">{{ t('eyebrow') }}</p>
        <h1 id="ministry-title">{{ ministry.name }}</h1>
        <p>{{ t('description') }}</p>
      </div>
      <AppStatusBadge :tone="ministry.status === 'active' ? 'success' : 'neutral'">
        {{ ministry.status === 'active' ? t('active') : t('inactive') }}
      </AppStatusBadge>
    </header>

    <section class="ministry-roles" aria-labelledby="ministry-roles-title">
      <header>
        <div>
          <p class="eyebrow">{{ t('serviceOrganization') }}</p>
          <h2 id="ministry-roles-title">{{ t('roles') }}</h2>
        </div>
        <div class="ministry-role-actions">
          <span>
            {{ ministry.roles.length }}
            {{ ministry.roles.length === 1 ? t('roleSingular') : t('rolePlural') }}
          </span>
          <AppButton
            :variant="roleFormOpen ? 'secondary' : 'primary'"
            :aria-expanded="roleFormOpen"
            aria-controls="ministry-role-form"
            @click="roleFormOpen = !roleFormOpen"
          >
            {{ roleFormOpen ? t('closeForm') : t('addRole') }}
          </AppButton>
        </div>
      </header>
      <form
        v-if="roleFormOpen"
        id="ministry-role-form"
        class="ministry-role-form"
        aria-labelledby="ministry-role-form-title"
        novalidate
        @submit.prevent="roleDefinition.defineRole"
      >
        <fieldset :disabled="roleDefinition.defining.value">
          <legend id="ministry-role-form-title">{{ t('createRole') }}</legend>
          <p class="ministry-role-form-description">
            {{ t('roleDescription') }}
          </p>
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
          <AppButton type="submit" :loading="roleDefinition.defining.value">
            {{ t('createRole') }}
          </AppButton>
          <p class="status" aria-live="polite">
            {{ roleDefinition.defining.value ? t('creatingRole') : '' }}
          </p>
        </fieldset>
      </form>
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
    </section>
  </article>
</template>

<style src="./ministry-details-page.css"></style>

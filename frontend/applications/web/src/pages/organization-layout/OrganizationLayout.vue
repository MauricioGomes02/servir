<script setup lang="ts">
import { toRef } from 'vue';
import { AppButton, AppIcon, AppStatusBadge } from '@/shared/ui';
import { useLocalizedMessages } from '@/shared/i18n';
import { organizationLayoutMessages } from './organization-layout.messages';
import { useOrganizationLayout } from './use-organization-layout';

const props = defineProps<{ organizationId: string }>();
const { activeNavigationArea, load, loading, organization, problem } = useOrganizationLayout(
  toRef(props, 'organizationId'),
);
const { t } = useLocalizedMessages(organizationLayoutMessages);
</script>

<template>
  <section v-if="loading" class="route-state" aria-live="polite">
    <p role="status">{{ t('loading') }}</p>
  </section>
  <section v-else-if="problem" class="route-state" aria-labelledby="organization-error-title">
    <p class="eyebrow">{{ t('cannotContinue') }}</p>
    <h1 id="organization-error-title">{{ problem.problem.title }}</h1>
    <AppButton variant="secondary" @click="load">{{ t('retry') }}</AppButton>
    <RouterLink
      class="app-button app-button-tertiary organization-error-back"
      :to="{ name: 'accessible-organizations' }"
    >
      <AppIcon name="back" />
      <span>{{ t('back') }}</span>
    </RouterLink>
  </section>
  <div v-else-if="organization" class="organization-shell">
    <header class="organization-context">
      <span class="workspace-symbol" aria-hidden="true"><AppIcon name="community" /></span>
      <div>
        <small>{{ t('organization') }}</small>
        <strong>{{ organization.name }}</strong>
        <RouterLink class="organization-switch" :to="{ name: 'accessible-organizations' }">
          <AppIcon name="community" />
          <span>{{ t('switchOrganization') }}</span>
        </RouterLink>
      </div>
      <AppStatusBadge tone="success">{{ t('active') }}</AppStatusBadge>
    </header>
    <div class="organization-workspace">
      <aside class="organization-sidebar">
        <nav :aria-label="t('navigation')">
          <ul class="organization-navigation">
            <li>
              <RouterLink
                :to="{ name: 'organization-home', params: { organizationId } }"
                :class="{ 'is-active': activeNavigationArea === 'home' }"
                :aria-current="activeNavigationArea === 'home' ? 'page' : undefined"
              >
                {{ t('home') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink
                :to="{ name: 'organization-ministries', params: { organizationId } }"
                :class="{ 'is-active': activeNavigationArea === 'ministries' }"
                :aria-current="activeNavigationArea === 'ministries' ? 'page' : undefined"
              >
                {{ t('ministries') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink
                :to="{ name: 'organization-members', params: { organizationId } }"
                :class="{ 'is-active': activeNavigationArea === 'members' }"
                :aria-current="activeNavigationArea === 'members' ? 'page' : undefined"
              >
                {{ t('members') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink
                :to="{ name: 'organization-activities', params: { organizationId } }"
                :class="{ 'is-active': activeNavigationArea === 'activities' }"
                :aria-current="activeNavigationArea === 'activities' ? 'page' : undefined"
              >
                {{ t('activities') }}
              </RouterLink>
            </li>
          </ul>
        </nav>
      </aside>
      <div class="organization-content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style src="./organization-layout.css"></style>

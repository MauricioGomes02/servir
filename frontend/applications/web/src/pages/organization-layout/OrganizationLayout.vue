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
  <main v-if="loading" id="main-content" class="route-state" tabindex="-1" aria-live="polite">
    <p role="status">{{ t('loading') }}</p>
  </main>
  <main
    v-else-if="problem"
    id="main-content"
    class="route-state"
    tabindex="-1"
    aria-labelledby="organization-error-title"
  >
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
  </main>
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
        <nav id="organization-navigation" tabindex="-1" :aria-label="t('navigation')">
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
      <main id="main-content" class="organization-content" tabindex="-1">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style src="./organization-layout.css"></style>

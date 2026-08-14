<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Church,
  HandHeart,
  Settings,
  Users,
} from '@lucide/vue';

type AppIconName = 'settings' | 'community' | 'people' | 'ministry' | 'calendar' | 'back' | 'arrow';

const icons = {
  settings: Settings,
  community: Church,
  people: Users,
  ministry: HandHeart,
  calendar: CalendarDays,
  back: ArrowLeft,
  arrow: ArrowRight,
};

const props = defineProps<{ name: AppIconName }>();
</script>

<template>
  <component :is="icons[props.name]" aria-hidden="true" :stroke-width="1.8" />
</template>

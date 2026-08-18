<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Church,
  Search,
  HandHeart,
  Settings,
  Users,
  X,
} from '@lucide/vue';

type AppIconName =
  | 'settings'
  | 'community'
  | 'people'
  | 'ministry'
  | 'calendar'
  | 'back'
  | 'arrow'
  | 'search'
  | 'close';

const icons = {
  settings: Settings,
  community: Church,
  people: Users,
  ministry: HandHeart,
  calendar: CalendarDays,
  back: ArrowLeft,
  arrow: ArrowRight,
  search: Search,
  close: X,
};

const props = defineProps<{ name: AppIconName }>();
</script>

<template>
  <component :is="icons[props.name]" aria-hidden="true" :stroke-width="1.8" />
</template>

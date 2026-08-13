<script setup lang="ts">
defineProps<{ name: 'settings' | 'community' | 'people' | 'ministry' | 'calendar' | 'arrow' }>();
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <g
      v-if="name === 'settings'"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V19.6h-2v-.08A1.7 1.7 0 0 0 12.36 18a1.7 1.7 0 0 0-1.88.34l-.06.06L9 16.98l.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.04H7.8v-2h.04A1.7 1.7 0 0 0 9.4 10.92a1.7 1.7 0 0 0-.34-1.88L9 8.98l1.42-1.42.06.06A1.7 1.7 0 0 0 12.36 8 1.7 1.7 0 0 0 13.4 6.44V6.4h2v.04A1.7 1.7 0 0 0 16.44 8a1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 9.02l-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 20.96 12H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z"
      />
    </g>
    <path v-else-if="name === 'community'" d="M4 20v-9l8-6 8 6v9h-6v-6h-4v6H4Z" />
    <path
      v-else-if="name === 'people'"
      d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19a5.5 5.5 0 0 1 11 0H3Zm10.5 0a6.8 6.8 0 0 0-1.3-4c3.7-2.1 8.8.5 8.8 4h-7.5Z"
    />
    <path
      v-else-if="name === 'ministry'"
      d="M12 3a4 4 0 0 1 4 4v2h2.5A2.5 2.5 0 0 1 21 11.5v7A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5v-7A2.5 2.5 0 0 1 5.5 9H8V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v2h4V7a2 2 0 0 0-2-2Z"
    />
    <path
      v-else-if="name === 'calendar'"
      d="M7 2h2v3h6V2h2v3h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V2Zm12 9H5v8h14v-8Z"
    />
    <path
      v-else
      d="m13.2 5.8 5.5 5.5a1 1 0 0 1 0 1.4l-5.5 5.5-1.4-1.4 3.8-3.8H5v-2h10.6l-3.8-3.8 1.4-1.4Z"
    />
  </svg>
</template>

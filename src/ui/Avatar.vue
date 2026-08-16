<script setup lang="ts">
defineProps<{
  src?: string
  alt: string
  initials: string
}>()
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :alt="alt"
    class="relative z-10 size-8 rounded-full object-cover ring-1 ring-stroke-weak cursor-pointer"
  />
  <span
    v-else
    class="relative z-10 flex size-8 items-center justify-center rounded-full bg-background-card font-medium text-annotation text-text-weak ring-1 ring-stroke-weak"
    :aria-label="alt || undefined"
    :aria-hidden="alt === ''"
  >
    {{ initials }}
  </span>
</template>

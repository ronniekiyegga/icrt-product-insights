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
    class="relative z-10 size-8 cursor-pointer rounded-full object-cover"
  />
  <span
    v-else
    class="relative z-10 flex size-8 items-center justify-center rounded-full bg-background-card font-medium text-annotation text-text-weak"
    :aria-label="alt || undefined"
    :aria-hidden="alt === ''"
  >
    {{ initials }}
  </span>
</template>

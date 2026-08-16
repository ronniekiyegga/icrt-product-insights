<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div
    class="flex flex-col mb-8 md:mb-4 gap-4 px-0.5 tablet:flex-row tablet:items-center tablet:justify-between"
  >
    <div class="flex flex-col gap-0.5 mb-3 tablet:mb-0">
      <h1 class="text-h4 text-text-strong">{{ title }}</h1>
      <p class="text-supertiny text-text-weak">{{ description }}</p>
    </div>
    <div class="flex w-full justify-end tablet:w-auto">
      <slot />
    </div>
  </div>
</template>

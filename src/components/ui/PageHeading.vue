<script setup lang="ts">
defineProps<{
  title: string
  description: string
  showExportAction: boolean
}>()
</script>

<template>
  <div
    class="flex w-full flex-col mb-2 md:mb-4 gap-4 px-0.5 tablet:flex-row tablet:items-center tablet:justify-between"
  >
    <div class="flex w-full min-w-0 flex-col gap-0.5 mb-3 tablet:mb-0">
      <h1 class="text-h4 text-text-strong">{{ title }}</h1>
      <p class="text-supertiny text-text-weak">{{ description }}</p>
    </div>
    <div
      class="shrink-0 justify-end tablet:min-h-export-action"
      :class="showExportAction ? 'flex w-full tablet:w-auto' : 'hidden tablet:flex tablet:w-auto'"
    >
      <slot />
    </div>
  </div>
</template>

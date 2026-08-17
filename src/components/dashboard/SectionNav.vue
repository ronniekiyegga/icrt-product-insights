<script setup lang="ts">
import { LayoutGrid } from '@lucide/vue'
</script>

<template>
  <nav class="flex items-center gap-4" aria-label="Section">
    <button
      type="button"
      class="flex cursor-pointer items-center gap-1.5 border-b border-text-strong mx-1 px-1 py-1.5 font-medium text-annotation text-text-strong"
    >
      <LayoutGrid class="size-3 fill-current" aria-hidden="true" />
      Overview
    </button>
    <button
      type="button"
      class="cursor-pointer border-b border-transparent px-2 py-1.5 font-normal text-annotation text-text-weak hover:text-text-strong"
      aria-disabled="true"
    >
      Audit Logs
    </button>
    <button
      type="button"
      class="cursor-pointer border-b border-transparent px-2 py-1.5 font-normal text-annotation text-text-weak hover:text-text-strong"
      aria-disabled="true"
    >
      Announcements
    </button>
  </nav>
</template>

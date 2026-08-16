<script setup lang="ts">
import { Download } from '@lucide/vue'
</script>

<template>
  <button
    type="button"
    class="inline-flex w-full cursor-pointer items-center justify-center gap-1 rounded-full border border-background-base bg-background-card px-4 py-4 font-semibold text-supertiny text-text-strong shadow-button tablet:w-auto tablet:px-6 tablet:py-3"
  >
    <Download class="size-4" aria-hidden="true" />
    Download PDF Report
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { testingData } from '../data/testingData'

const footnote = computed(
  () =>
    `${testingData.products.length} of ${testingData.aggregate_stats.total_tested} products shown · Aggregates cover full category`,
)
</script>

<template>
  <footer class="w-full bg-background-base">
    <div class="page flex items-center justify-between border-t border-stroke-weak py-4">
      <p class="text-supertiny text-stroke-strong">
        © 2026 International Consumer Research & Testing.
      </p>
      <p class="text-supertiny text-stroke-strong">
        {{ footnote }}
      </p>
    </div>
  </footer>
</template>

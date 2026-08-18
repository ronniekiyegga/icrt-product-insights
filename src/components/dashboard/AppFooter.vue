<script setup lang="ts">
import { computed } from 'vue'
import { testingData } from '../../data/testingData'

const productCount = computed(
  () =>
    `${testingData.products.length} of ${testingData.aggregate_stats.total_tested} products shown`,
)

const footnote = computed(() => `${productCount.value} · Aggregates cover full category`)
</script>

<template>
  <footer class="w-full bg-background-base">
    <div class="page flex items-center justify-between border-t border-stroke-weak py-4">
      <p class="text-supertiny text-text-weak mobile:hidden">
        © 2026 International Consumer Research & Testing.
      </p>
      <p class="hidden text-supertiny text-text-weak mobile:block">
        © 2026 ICRT. All rights reserved.
      </p>
      <p class="text-supertiny text-text-weak mobile:hidden">
        {{ footnote }}
      </p>
      <p class="hidden text-supertiny text-text-weak mobile:block">
        {{ productCount }}
      </p>
    </div>
  </footer>
</template>

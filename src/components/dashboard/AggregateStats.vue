<script setup lang="ts">
import { computed } from 'vue'
import { testingData } from '../../data/testingData'
import StatCard from '../ui/StatCard.vue'
import IcrtMark from '../icons/IcrtMark.vue'

const aggregateCards = computed(() => {
  const { category, aggregate_stats, products } = testingData

  return [
    {
      category: 'Performance',
      title: 'Average Score',
      value: String(aggregate_stats.avg_score),
      unit: '/ 100',
      subtitle: `Across ${aggregate_stats.total_tested} products tested`,
    },
    {
      category: 'Test Coverage',
      title: 'Products Tested',
      value: String(aggregate_stats.total_tested),
      subtitle: `${category} · ${products.length} shown below`,
    },
    {
      category: 'Turnaround',
      title: 'Avg. Time To Result',
      value: String(aggregate_stats.avg_ttr_days),
      unit: 'days',
      subtitle: 'Category average',
    },
  ]
})
</script>

<template>
  <div class="mb-6 grid grid-cols-1 gap-2 px-1 tablet:grid-cols-3 md:mb-8">
    <StatCard v-for="card in aggregateCards" :key="card.category" v-bind="card">
      <template #icon>
        <IcrtMark class="size-3 bg-brand-deep" />
      </template>
    </StatCard>
  </div>
</template>

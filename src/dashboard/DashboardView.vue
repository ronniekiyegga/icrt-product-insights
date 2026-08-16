<script setup lang="ts">
import { computed, ref } from 'vue'
import { resolveCapabilities } from '../entitlements/capabilities'
import type { Tier } from '../entitlements/types'
import PageHeading from '../ui/PageHeading.vue'
import AggregateStats from './AggregateStats.vue'
import AppFooter from './AppFooter.vue'
import AppHeader from './AppHeader.vue'
import ReportExportButton from './ReportExportButton.vue'
import SectionNav from './SectionNav.vue'

const tier = ref<Tier>('basic')
const capabilities = computed(() => resolveCapabilities(tier.value))
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background-base">
    <AppHeader v-model:tier="tier" />
    <main class="flex-1">
      <p aria-live="polite" class="sr-only">Viewing as {{ tier }}</p>
      <div class="page pt-8 pb-8 tablet:pt-12 desktop:pt-10">
        <div class="flex flex-col gap-6 tablet:gap-10 desktop:gap-8">
          <PageHeading
            title="Dishwashers · Product testing overview"
            description="Independent product performance evaluation"
          >
            <ReportExportButton />
          </PageHeading>
          <div class="flex flex-col gap-8">
            <SectionNav />
            <AggregateStats v-if="capabilities.viewAggregates" />
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

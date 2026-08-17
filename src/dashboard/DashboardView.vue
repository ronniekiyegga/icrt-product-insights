<script setup lang="ts">
import { ChartNoAxesColumn } from '@lucide/vue'
import { computed, ref } from 'vue'
import { resolveCapabilities } from '../entitlements/capabilities'
import type { Tier } from '../entitlements/types'
import ChartSkeleton from '../ui/ChartSkeleton.vue'
import PageHeading from '../ui/PageHeading.vue'
import AggregateStats from './AggregateStats.vue'
import AppFooter from './AppFooter.vue'
import AppHeader from './AppHeader.vue'
import ComparisonGate from './ComparisonGate.vue'
import ReportExportButton from './ReportExportButton.vue'
import ScoreComparison from './ScoreComparison.vue'
import SectionNav from './SectionNav.vue'

const tier = ref<Tier>('basic')
const capabilities = computed(() => resolveCapabilities(tier.value))

function onExport() {
  return
}
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
            :show-export-action="capabilities.viewComparison"
          >
            <ReportExportButton
              :enabled="capabilities.exportReport"
              :visible="capabilities.viewComparison"
              @export="onExport"
            />
          </PageHeading>
          <div class="flex flex-col gap-8">
            <SectionNav />
            <AggregateStats v-if="capabilities.viewAggregates" />
            <section class="flex flex-col gap-6 md:mx-3">
              <h2 class="flex items-center gap-2 font-semibold leading-none text-tiny text-text-strong">
                <ChartNoAxesColumn
                  class="size-3 shrink-0 text-gradient-red-to"
                  :stroke-width="2.5"
                  aria-hidden="true"
                />
                Products Score Comparison
              </h2>
              <Transition name="fade" mode="out-in">
                <ScoreComparison v-if="capabilities.viewComparison" />
                <div v-else class="comparison-gate-slot">
                  <div class="comparison-gate-plot blur-sm" aria-hidden="true">
                    <ChartSkeleton class="w-full opacity-placeholder" />
                  </div>
                  <div class="comparison-gate-card flex w-full items-center justify-center px-1 mobile:py-8">
                    <ComparisonGate />
                  </div>
                </div>
              </Transition>
            </section>
          </div>
        </div>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

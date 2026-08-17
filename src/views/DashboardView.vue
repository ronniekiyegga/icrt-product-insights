<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { resolveCapabilities } from '../entitlements/capabilities'
import type { Tier } from '../entitlements/types'
import ChartSkeleton from '../components/ui/ChartSkeleton.vue'
import PageHeading from '../components/ui/PageHeading.vue'
import AggregateStats from '../components/dashboard/AggregateStats.vue'
import AppFooter from '../components/dashboard/AppFooter.vue'
import AppHeader from '../components/dashboard/AppHeader.vue'
import ComparisonGate from '../components/dashboard/ComparisonGate.vue'
import ReportExportButton from '../components/dashboard/ReportExportButton.vue'
import SectionNav from '../components/dashboard/SectionNav.vue'
import ScoreComparisonIcon from '../components/icons/ScoreComparisonIcon.vue'
import { generateReport } from '../reports/generateReport'

const ScoreComparison = defineAsyncComponent({
  loader: () => import('../components/dashboard/ScoreComparison.vue'),
  loadingComponent: ChartSkeleton,
  delay: 0,
})

const tier = ref<Tier>('basic')
const capabilities = computed(() => resolveCapabilities(tier.value))
const exportPending = ref(false)
const exportError = ref('')

async function onExport() {
  if (exportPending.value || !capabilities.value.exportReport) {
    return
  }

  exportPending.value = true
  exportError.value = ''

  const result = await generateReport()
  exportPending.value = false

  if (result.status === 'failed') {
    exportError.value = result.reason
  }
}

function onUpgrade() {
  tier.value = 'premium'
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
              :busy="exportPending"
              :error="exportError"
              @export="onExport"
            />
          </PageHeading>
          <div class="flex flex-col gap-8">
            <SectionNav />
            <AggregateStats v-if="capabilities.viewAggregates" />
            <section class="flex flex-col gap-6 md:mx-3">
              <h2
                class="flex items-center gap-2 font-semibold leading-none text-tiny text-text-strong"
              >
                <ScoreComparisonIcon />
                Products Score Comparison
              </h2>
              <Transition name="fade" mode="out-in">
                <ScoreComparison v-if="capabilities.viewComparison" />
                <div v-else class="comparison-gate-slot">
                  <div class="comparison-gate-plot blur-sm" aria-hidden="true">
                    <ChartSkeleton class="w-full opacity-placeholder" />
                  </div>
                  <div
                    class="comparison-gate-card flex w-full items-center justify-center px-1 mobile:py-8"
                  >
                    <ComparisonGate @action="onUpgrade" />
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

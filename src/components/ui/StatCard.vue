<script setup lang="ts">
import { EllipsisVertical, Info } from '@lucide/vue'

defineProps<{
  category: string
  title: string
  value: string
  unit?: string
  subtitle: string
}>()
</script>

<template>
  <section
    class="flex min-w-0 flex-col gap-3 rounded-xl bg-background-card px-1 pt-4 pb-0.5 tablet-only:h-full"
  >
    <header class="flex shrink-0 items-center justify-between px-5">
      <span class="font-normal text-annotation text-stroke-strong tablet-only:text-tooltip-sm">{{
        category
      }}</span>
      <Info class="size-4 shrink-0 text-icon-neutral" aria-hidden="true" />
    </header>
    <div
      class="flex min-w-0 flex-col gap-3 rounded-xl border-4 border-background-base bg-background-card px-5 py-6 shadow-card tablet-only:min-h-0 tablet-only:flex-1"
    >
      <div class="flex justify-between py-0.5 tablet-only:min-h-0 tablet-only:flex-1">
        <div class="flex min-w-0 gap-2.5 tablet-only:min-h-0 tablet-only:flex-1">
          <span
            class="flex shrink-0 items-center justify-center self-start rounded-sm bg-background-base p-1.5 shadow-button"
            aria-hidden="true"
          >
            <slot name="icon" />
          </span>
          <div class="flex min-w-0 flex-col gap-1 tablet-only:min-h-0 tablet-only:flex-1">
            <span class="font-normal text-annotation text-text-weak">{{ title }}</span>
            <p class="flex items-baseline gap-1">
              <span class="font-semibold text-h2 text-text-strong tablet-only:text-h3">{{
                value
              }}</span>
              <span v-if="unit" class="font-normal text-annotation text-text-weak">{{ unit }}</span>
            </p>
            <p class="px-1 font-normal text-annotation text-text-weak tablet-only:mt-auto">
              {{ subtitle }}
            </p>
          </div>
        </div>
        <EllipsisVertical class="size-4 shrink-0 text-icon-neutral" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>

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
  <section class="flex flex-col gap-3 rounded-xl bg-background-card px-1 pt-4 pb-0.5">
    <header class="flex items-center justify-between px-5">
      <span class="font-normal text-annotation text-stroke-strong">{{ category }}</span>
      <Info class="size-4 shrink-0 text-icon-neutral" aria-hidden="true" />
    </header>
    <div
      class="flex flex-col gap-3 rounded-xl border-4 border-background-base bg-background-card px-5 py-6 shadow-card"
    >
      <div class="flex justify-between py-0.5">
        <div class="flex gap-2.5">
          <span
            class="flex shrink-0 items-center justify-center self-start rounded-sm bg-background-base p-1.5 shadow-button"
            aria-hidden="true"
          >
            <slot name="icon" />
          </span>
          <div class="flex flex-col gap-1">
            <span class="font-normal text-annotation text-text-strong">{{ title }}</span>
            <p class="flex items-baseline gap-1">
              <span class="text-h2 font-semibold text-text-strong">{{ value }}</span>
              <span v-if="unit" class="font-normal text-annotation text-text-weak">{{ unit }}</span>
            </p>
            <p class="px-1 font-normal text-annotation text-text-strong">{{ subtitle }}</p>
          </div>
        </div>
        <EllipsisVertical class="size-4 shrink-0 text-icon-neutral" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>

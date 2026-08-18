<script setup lang="ts">
defineProps<{
  visible: boolean
  x: number
  brand: string
  model: string
  score: number
  ttrDays: number
}>()
</script>

<template>
  <Transition name="score-tooltip">
    <div
      v-show="visible"
      class="tooltip-axis-anchor pointer-events-none absolute left-0 z-20 flex flex-col items-center"
      :style="{
        transform: `translate3d(${String(x)}px, 0, 0) translateX(-50%)`,
        top: 'calc(var(--height-tooltip) * -1)',
      }"
    >
      <div class="w-44 shrink-0 rounded-tooltip bg-background-base p-px shadow-tooltip">
        <div
          class="flex flex-col gap-1 rounded-tooltip border-tooltip border-stroke-tooltip bg-tooltip px-0.5 py-1.5"
        >
          <div class="flex items-center justify-between px-2">
            <span class="font-medium text-tooltip text-text-strong">{{ brand }}</span>
            <span class="inline-flex items-end gap-1">
              <span class="font-medium text-tooltip-sm leading-none text-text-faint tabular-nums">{{
                score
              }}</span>
              <span class="flex h-2 shrink-0 items-end gap-px pb-px" aria-hidden="true">
                <span
                  class="h-1 w-px rounded-full bg-linear-to-b from-gradient-hover to-gradient-red-to"
                />
                <span
                  class="h-1.5 w-px rounded-full bg-linear-to-b from-gradient-hover to-gradient-red-to"
                />
                <span
                  class="h-2 w-px rounded-full bg-linear-to-b from-gradient-hover to-gradient-red-to"
                />
              </span>
            </span>
          </div>
          <div class="mx-2 border-t border-stroke-weak" />
          <div class="flex items-center justify-between gap-2 px-2 py-1">
            <span class="flex items-center gap-1">
              <span
                class="size-2 shrink-0 rounded-full border border-background-base bg-tooltip-marker"
                aria-hidden="true"
              />
              <span class="font-medium text-tooltip-sm text-text-navy">{{ model }}</span>
            </span>
            <span class="font-normal text-tooltip-meta text-text-navy">
              TTR ({{ ttrDays }} days)
            </span>
          </div>
        </div>
      </div>
      <div class="min-h-0 w-px flex-1 border-l border-dashed border-brand" />
      <span class="size-2.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
    </div>
  </Transition>
</template>

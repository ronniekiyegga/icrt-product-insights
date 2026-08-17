<template>
  <div class="relative h-chart overflow-visible" aria-hidden="true">
    <div class="size-full border-l-6 border-background-card pl-4 md:pl-8">
      <div
        class="chart-plot-inset flex h-full flex-col items-start justify-start gap-1 tablet:gap-2"
      >
        <div
          class="h-chart-bar-mobile w-skeleton-lead shrink-0 rounded-full bg-chart-bar tablet:h-chart-bar"
        />
        <div
          class="h-chart-bar-mobile w-skeleton-mid shrink-0 rounded-full bg-chart-bar tablet:h-chart-bar"
        />
        <div
          class="h-chart-bar-mobile w-skeleton-trail shrink-0 rounded-full bg-chart-bar tablet:h-chart-bar"
        />
      </div>
    </div>
  </div>
</template>

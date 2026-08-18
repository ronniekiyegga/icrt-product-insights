<script setup lang="ts">
defineProps<{
  insetLeft: number
  insetRight: number
}>()

const scaleTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
</script>

<template>
  <div class="absolute inset-x-0 top-full flex flex-col gap-chart-caption-gap pt-chart-axis">
    <div
      class="flex justify-between text-annotation text-text-weak tablet:text-tiny"
      :style="{
        paddingLeft: `${String(insetLeft)}px`,
        paddingRight: `${String(insetRight)}px`,
      }"
    >
      <span v-for="tick in scaleTicks" :key="tick">{{ tick }}</span>
    </div>
    <p class="text-center font-normal text-annotation text-text-weak">
      Overall product performance score (0–100)
    </p>
  </div>
</template>

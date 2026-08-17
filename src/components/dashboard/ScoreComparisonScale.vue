<script setup lang="ts">
defineProps<{
  insetLeft: number
  insetRight: number
}>()

const scaleTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
</script>

<template>
  <div class="absolute inset-x-0 top-full pl-4 pt-4 tablet:pl-8 tablet:pt-16">
    <div
      class="flex justify-between text-annotation text-stroke-strong tablet:text-tiny"
      :style="{
        paddingLeft: `${String(insetLeft)}px`,
        paddingRight: `${String(insetRight)}px`,
      }"
    >
      <span v-for="tick in scaleTicks" :key="tick">{{ tick }}</span>
    </div>
  </div>
</template>

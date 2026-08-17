<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'

defineProps<{
  title: string
  description: string
  actionLabel: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div
    class="flex min-h-gate-card w-full max-w-gate-card shrink-0 flex-col rounded-gate-frame bg-gradient-gate-stroke p-gate-stroke shadow-gate-frame tablet:w-gate-card"
  >
    <div
      class="flex w-full flex-col items-center gap-gate-inner rounded-gate-card border-gate-card border-solid border-background-base bg-background-card px-gate-inner-x pt-gate-inner-y pb-gate-inner-bottom shadow-gate-card"
    >
      <span
        class="flex shrink-0 items-center justify-center rounded-full border-gate-lock border-solid border-background-base bg-background-lock p-gate-lock shadow-gate-lock"
        aria-hidden="true"
      >
        <span class="flex size-gate-lock-icon-box items-center justify-center">
          <svg
            class="h-gate-lock-icon w-gate-lock-icon text-text-ink"
            viewBox="0 0 10 13"
            fill="none"
          >
            <rect
              x="0.75"
              y="5.4"
              width="8.5"
              height="6.85"
              rx="1.4"
              stroke="currentColor"
              stroke-width="1.1"
            />
            <path
              d="M2.7 5.4V3.55a2.3 2.3 0 0 1 4.6 0V5.4"
              stroke="currentColor"
              stroke-width="1.1"
              stroke-linecap="round"
            />
          </svg>
        </span>
      </span>
      <div class="flex w-full grow flex-col self-stretch gap-gate-section">
        <div class="flex flex-col gap-gate-copy self-stretch">
          <h3 class="text-center font-semibold text-gate-title text-text-ink">
            {{ title }}
          </h3>
          <p class="w-full text-center font-normal text-gate-body text-text-weak">
            {{ description }}
          </p>
        </div>
        <div class="h-px w-full shrink-0 bg-stroke-weak" role="presentation" />
        <div class="flex w-full shrink-0 rounded-xl bg-background-inset p-1 shadow-button">
          <button
            type="button"
            class="gate-action inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-10 py-3 font-semibold text-gate-action text-text-inverse"
            @click="emit('action')"
          >
            {{ actionLabel }}
            <ArrowUpRight
              class="size-gate-arrow shrink-0 opacity-icon-muted"
              :stroke-width="2"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

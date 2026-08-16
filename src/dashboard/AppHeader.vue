<script setup lang="ts">
import type { Tier } from '../entitlements/types'
import Avatar from '../ui/Avatar.vue'
import TierSwitcher from './TierSwitcher.vue'

defineProps<{
  tier: Tier
}>()

const emit = defineEmits<{
  'update:tier': [tier: Tier]
}>()
</script>

<template>
  <header class="w-full bg-background-base mb-8 tablet:mb-12">
    <div class="page flex items-center justify-between border-b border-stroke-weak py-4">
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1">
          <span
            class="flex size-5 shrink-0 items-center justify-center rounded-sm bg-brand"
            aria-hidden="true"
          >
            <img src="/ICRT.svg" alt="" class="size-2.5" />
          </span>
          <span class="hidden font-medium text-tiny text-text-weak tablet:inline">ICRT</span>
        </div>
        <span class="hidden h-6 w-px bg-stroke-weak tablet:block" aria-hidden="true" />
        <span class="font-normal text-annotation text-text-weak">Research Platform</span>
      </div>
      <div class="group/account flex items-center gap-3">
        <span class="relative inline-flex rounded-full">
          <span
            class="pointer-events-none absolute -inset-px rounded-full bg-gradient-hover opacity-0 transition-opacity group-hover/account:opacity-50 group-focus-within/account:opacity-50"
            aria-hidden="true"
          />
          <Avatar src="/avatar.jpg" alt="John Doe" initials="JD" />
        </span>
        <TierSwitcher :tier="tier" @update:tier="emit('update:tier', $event)" />
      </div>
    </div>
  </header>
</template>

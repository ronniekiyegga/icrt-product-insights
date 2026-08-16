<script setup lang="ts">
import { ChevronsUpDown } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { TIERS } from '../entitlements/capabilities'
import type { Tier } from '../entitlements/types'
import HoverWash from '../ui/HoverWash.vue'
import IcrtMark from './IcrtMark.vue'
import { TIER_GRADIENT } from './tierGradient'

defineProps<{
  tier: Tier
}>()

const emit = defineEmits<{
  'update:tier': [tier: Tier]
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function pick(next: Tier) {
  emit('update:tier', next)
  open.value = false
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target
  if (target instanceof Node && root.value?.contains(target)) {
    return
  }
  open.value = false
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      id="tier-switcher"
      type="button"
      class="inline-flex cursor-pointer items-center gap-2"
      aria-label="Viewing as"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="rounded-full bg-background-base p-0.5 shadow-button" aria-hidden="true">
        <span class="block size-2 rounded-full" :class="TIER_GRADIENT[tier]" />
      </span>
      <span class="font-normal text-annotation capitalize text-text-strong">{{ tier }}</span>
      <ChevronsUpDown class="size-4 text-icon-neutral" aria-hidden="true" />
    </button>
    <ul
      v-if="open"
      class="absolute top-full right-0 z-20 mt-2 flex w-44 flex-col rounded-xl bg-background-base py-2 shadow-card"
      role="listbox"
      aria-labelledby="tier-switcher"
    >
      <li
        v-for="option in TIERS"
        :key="option"
        role="option"
        :aria-selected="option === tier"
        class="mx-3 border-b border-stroke-weak last:border-b-0"
      >
        <button
          type="button"
          class="group relative flex w-full cursor-pointer items-center gap-2 overflow-hidden py-2 pr-3 pl-1"
          @click="pick(option)"
        >
          <HoverWash />
          <IcrtMark class="relative size-3" :class="TIER_GRADIENT[option]" />
          <span class="relative font-normal text-annotation capitalize text-text-strong">{{ option }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

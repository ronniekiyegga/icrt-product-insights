<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { TIERS } from '../entitlements/capabilities'
import type { Tier } from '../entitlements/types'
import Avatar from '../ui/Avatar.vue'
import TierCaret from '../ui/TierCaret.vue'
import { TIER_GRADIENT, TIER_MENU_DOT, TIER_MENU_DOT_RING } from './tierGradient'

defineProps<{
  tier: Tier
}>()

const emit = defineEmits<{
  'update:tier': [tier: Tier]
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
let closeTimer: ReturnType<typeof setTimeout> | undefined

function openMenu() {
  if (closeTimer !== undefined) {
    clearTimeout(closeTimer)
    closeTimer = undefined
  }

  open.value = true
}

function scheduleClose() {
  if (closeTimer !== undefined) {
    clearTimeout(closeTimer)
  }

  closeTimer = setTimeout(() => {
    open.value = false
    closeTimer = undefined
  }, 120)
}

function pick(next: Tier) {
  emit('update:tier', next)
  open.value = false
}

function toggleMenu() {
  if (open.value) {
    scheduleClose()
    return
  }

  openMenu()
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
  if (closeTimer !== undefined) {
    clearTimeout(closeTimer)
  }
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div ref="root" class="relative shrink-0" @mouseenter="openMenu" @mouseleave="scheduleClose">
    <button
      id="tier-switcher"
      type="button"
      class="inline-flex cursor-pointer items-center gap-tier-avatar-label rounded-full py-0.5 pl-0.5"
      :aria-label="`Viewing as ${tier}, Alex Johnson`"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggleMenu"
    >
      <span class="relative shrink-0">
        <Avatar src="/avatar.jpg" alt="" initials="JD" />
        <span class="tier-badge absolute right-0 bottom-0 z-20" aria-hidden="true">
          <span class="tier-badge-dot" :class="TIER_GRADIENT[tier]" />
        </span>
      </span>
      <span class="flex flex-col gap-tier-label-stack text-left">
        <span class="font-normal text-annotation capitalize text-text-tier-menu">{{ tier }}</span>
        <span class="inline-flex items-center gap-tier-label-chevron">
          <span class="font-semibold text-tiny text-text-navy">Alex Johnson</span>
          <TierCaret />
        </span>
      </span>
    </button>
    <div v-if="open" class="tier-switcher-menu">
      <ul
        class="tier-switcher-menu-panel shadow-tier-menu"
        role="listbox"
        aria-labelledby="tier-switcher"
        @mouseenter="openMenu"
      >
        <li
          v-for="(option, index) in TIERS"
          :key="option"
          role="option"
          :aria-selected="option === tier"
          class="tier-switcher-menu-item"
        >
          <div class="tier-switcher-menu-item-shell">
            <div class="group/tier-item tier-switcher-menu-item-block">
              <span
                class="pointer-events-none absolute inset-0 bg-gradient-menu-hover opacity-0 transition-opacity group-hover/tier-item:opacity-100 group-focus-within/tier-item:opacity-100"
                aria-hidden="true"
              />
              <button type="button" class="tier-switcher-menu-button" @click="pick(option)">
                <span
                  class="tier-badge relative z-[1]"
                  :class="TIER_MENU_DOT_RING[option]"
                  aria-hidden="true"
                >
                  <span class="tier-badge-dot" :class="TIER_MENU_DOT[option]" />
                </span>
                <span class="relative z-[1] capitalize">{{ option }}</span>
              </button>
            </div>
            <hr v-if="index < TIERS.length - 1" class="tier-switcher-menu-divider" />
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

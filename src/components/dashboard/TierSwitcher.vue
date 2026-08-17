<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { TIERS } from '../../entitlements/capabilities'
import type { Tier } from '../../entitlements/types'
import Avatar from '../ui/Avatar.vue'
import TierCaret from '../icons/TierCaret.vue'

const TIER_DOT: Record<Tier, string> = {
  basic: 'bg-gradient-green',
  premium: 'bg-gradient-blue',
  enterprise: 'bg-gradient-red',
}

const TIER_DOT_RING: Record<Tier, string> = {
  basic: 'tier-badge--basic',
  premium: 'tier-badge--premium',
  enterprise: 'tier-badge--enterprise',
}

defineProps<{
  tier: Tier
}>()

const emit = defineEmits<{
  'update:tier': [tier: Tier]
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const optionButtons = ref<(HTMLButtonElement | null)[]>([])
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

function bindOption(index: number, el: unknown) {
  optionButtons.value[index] = el instanceof HTMLButtonElement ? el : null
}

function focusOption(index: number) {
  const count = optionButtons.value.length
  if (count === 0) {
    return
  }

  const wrappedIndex = (index + count) % count
  optionButtons.value[wrappedIndex]?.focus()
}

async function openAndFocus(index: number) {
  openMenu()
  await nextTick()
  focusOption(index)
}

async function pick(next: Tier) {
  emit('update:tier', next)
  open.value = false
  await nextTick()
  trigger.value?.focus({ preventScroll: true })
}

function toggleMenu() {
  if (open.value) {
    scheduleClose()
    return
  }

  openMenu()
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
    return
  }

  event.preventDefault()
  void openAndFocus(event.key === 'ArrowDown' ? 0 : TIERS.length - 1)
}

function onOptionKeydown(event: KeyboardEvent, index: number) {
  if (event.key === 'Escape') {
    event.preventDefault()
    open.value = false
    trigger.value?.focus({ preventScroll: true })
    return
  }

  const nextIndex =
    event.key === 'ArrowDown'
      ? index + 1
      : event.key === 'ArrowUp'
        ? index - 1
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? TIERS.length - 1
            : undefined

  if (nextIndex === undefined) {
    return
  }

  event.preventDefault()
  focusOption(nextIndex)
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target
  if (target instanceof Node && root.value?.contains(target)) {
    return
  }

  open.value = false
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    open.value = false
    trigger.value?.focus({ preventScroll: true })
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
      ref="trigger"
      id="tier-switcher"
      type="button"
      class="inline-flex cursor-pointer items-center gap-tier-avatar-label rounded-full py-0.5 pl-0.5"
      :aria-label="`Viewing as ${tier}, Alex Johnson`"
      aria-haspopup="menu"
      aria-controls="tier-menu"
      :aria-expanded="open"
      @click="toggleMenu"
      @keydown="onTriggerKeydown"
    >
      <span class="relative shrink-0">
        <Avatar src="/avatar.jpg" alt="" initials="JD" />
        <span
          class="tier-badge tier-badge--overlay absolute right-0 bottom-0 z-20"
          :class="TIER_DOT_RING[tier]"
          aria-hidden="true"
        >
          <span class="tier-badge-dot" :class="TIER_DOT[tier]" />
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
        id="tier-menu"
        class="tier-switcher-menu-panel shadow-tier-menu"
        role="menu"
        aria-labelledby="tier-switcher"
        @mouseenter="openMenu"
      >
        <li
          v-for="(option, index) in TIERS"
          :key="option"
          role="none"
          class="tier-switcher-menu-item"
        >
          <div class="tier-switcher-menu-item-shell">
            <div class="group/tier-item tier-switcher-menu-item-block">
              <span
                class="pointer-events-none absolute inset-0 bg-gradient-menu-hover opacity-0 transition-opacity group-hover/tier-item:opacity-100 group-focus-within/tier-item:opacity-100"
                aria-hidden="true"
              />
              <button
                :ref="(el) => bindOption(index, el)"
                type="button"
                role="menuitemradio"
                :aria-checked="option === tier"
                class="tier-switcher-menu-button"
                @click="pick(option)"
                @keydown="onOptionKeydown($event, index)"
              >
                <span
                  class="tier-badge relative z-(--z-tier-content)"
                  :class="TIER_DOT_RING[option]"
                  aria-hidden="true"
                >
                  <span class="tier-badge-dot" :class="TIER_DOT[option]" />
                </span>
                <span class="relative z-(--z-tier-content) capitalize">{{ option }}</span>
              </button>
            </div>
            <hr v-if="index < TIERS.length - 1" class="tier-switcher-menu-divider" />
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

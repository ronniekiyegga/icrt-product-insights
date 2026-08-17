<script setup lang="ts">
import ExportDownloadIcon from '../ui/ExportDownloadIcon.vue'

const props = defineProps<{
  enabled: boolean
  visible: boolean
}>()

const emit = defineEmits<{
  export: []
}>()

function onClick() {
  if (!props.visible || !props.enabled) {
    return
  }

  emit('export')
}

function onKeydown(event: KeyboardEvent) {
  if (props.visible && props.enabled) {
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
  }
}
</script>

<template>
  <div
    class="flex w-full flex-col items-center gap-2 tablet:w-auto tablet:items-end"
    :class="visible ? undefined : 'hidden'"
    :aria-hidden="visible ? undefined : true"
  >
    <button
      type="button"
      class="inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-full border border-background-base px-4 py-4 font-semibold text-supertiny shadow-button tablet:w-auto tablet:px-6 tablet:py-3"
      :class="
        enabled
          ? 'group/export cursor-pointer bg-background-card'
          : 'cursor-not-allowed bg-background-card text-text-disabled'
      "
      :tabindex="visible ? undefined : -1"
      :aria-disabled="enabled ? undefined : true"
      :aria-describedby="visible && !enabled ? 'export-gate-reason' : undefined"
      @click="onClick"
      @keydown="onKeydown"
    >
      <ExportDownloadIcon :gradient="enabled" />
      <template v-if="enabled">
        <span class="relative">
          <span class="bg-gradient-gate-action bg-clip-text text-transparent">
            Download PDF Report
          </span>
          <span
            class="absolute inset-0 bg-gradient-export-hover bg-clip-text text-transparent opacity-0 transition-opacity duration-fade group-hover/export:opacity-100 group-focus-visible/export:opacity-100"
            aria-hidden="true"
          >
            Download PDF Report
          </span>
        </span>
      </template>
      <template v-else> Download PDF Report </template>
    </button>
    <p
      id="export-gate-reason"
      class="min-h-[var(--height-export-gate-reason)] w-full shrink-0 text-center font-normal text-annotation leading-[var(--text-annotation--line-height)] text-text-weak tablet:text-right"
      :class="visible && !enabled ? undefined : 'invisible'"
      :aria-hidden="visible && !enabled ? undefined : true"
    >
      Report export requires Enterprise access
    </p>
  </div>
</template>

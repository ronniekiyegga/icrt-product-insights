<script setup lang="ts">
import AccessGate from '../ui/AccessGate.vue'

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <AccessGate
    title="Product-level results"
    description="Premium opens up the individual scores and testing times behind that average."
    action-label="See Premium Plans"
    @action="emit('action')"
  />
</template>

<template>
  <div>
    <DesktopSidebar v-bind="$attrs" />
    <MobileSidebar v-bind="$attrs" />
  </div>
</template>

<script setup lang="ts">
import { provide, toRef } from 'vue'
import DesktopSidebar from './DesktopSidebar.vue'
import MobileSidebar from './MobileSidebar.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  animate: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:open'])

const setOpen = (value: boolean) => {
  emit('update:open', value)
}

provide('sidebar', {
  open: toRef(props, 'open'),
  setOpen,
  animate: toRef(props, 'animate'),
})
</script>

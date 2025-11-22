<template>
  <div
    :class="cn(
      'h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] flex-shrink-0 transition-all duration-300',
      className
    )"
    :style="{ width: animate ? (open ? '300px' : '60px') : '300px' }"
    @mouseenter="setOpen(true)"
    @mouseleave="setOpen(false)"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { cn } from '@/lib/utils'
import { type SidebarContext } from './types'

const { open, setOpen, animate } = inject<SidebarContext>('sidebar')!

defineProps<{
  className?: string
}>()
</script>

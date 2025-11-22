<template>
  <component
    :is="link.action ? 'button' : 'router-link'"
    :to="link.href"
    :class="cn('flex items-center justify-start gap-2 group/sidebar py-2', className)"
    @click="link.action"
  >
    <component :is="link.icon" />
    <transition
      enter-active-class="transition-all duration-150"
      leave-active-class="transition-all duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <span v-if="open" class="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0">
        {{ link.label }}
      </span>
    </transition>
  </component>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { cn } from '@/lib/utils'
import { type SidebarContext } from './types'

const { open } = inject<SidebarContext>('sidebar')!

defineProps<{
  link: {
    label: string
    href: string
    icon: any
    action?: () => void
  }
  className?: string
}>()
</script>

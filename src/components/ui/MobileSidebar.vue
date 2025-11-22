<template>
  <div :class="cn('h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full', className)">
    <div class="flex justify-end z-20 w-full">
      <Menu class="text-neutral-800 dark:text-neutral-200 cursor-pointer" @click="setOpen(!open)" />
    </div>
    <transition
      enter-active-class="transition-all duration-300 ease-in-out"
      leave-active-class="transition-all duration-300 ease-in-out"
      enter-from-class="-translate-x-full opacity-0"
      leave-to-class="-translate-x-full opacity-0"
    >
      <div
        v-if="open"
        :class="cn('fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between', className)"
      >
        <div class="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer" @click="setOpen(!open)">
          <X />
        </div>
        <slot />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { Menu, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { type SidebarContext } from './types'

const { open, setOpen } = inject<SidebarContext>('sidebar')!

defineProps<{
  className?: string
}>()
</script>

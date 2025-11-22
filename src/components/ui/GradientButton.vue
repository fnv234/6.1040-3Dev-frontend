<template>
  <button :class="cn(gradientButtonVariants({ variant }), className)">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const gradientButtonVariants = cva(
  [
    'gradient-button',
    'inline-flex items-center justify-center',
    'rounded-[11px] min-w-[132px] px-9 py-4',
    'text-base leading-[19px] font-[500] text-white',
    'font-sans font-bold',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: '',
        variant: 'gradient-button-variant',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

defineProps<{
  className?: string
  variant?: VariantProps<typeof gradientButtonVariants>['variant']
}>()
</script>

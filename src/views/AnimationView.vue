<template>
  <div class="relative flex h-[650px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border bg-blue-700">
    <ShaderAnimation />
    <span class="absolute pointer-events-none z-10 text-center text-7xl leading-none font-semibold tracking-tighter whitespace-pre-wrap text-white">
      Shader Animation
    </span>
  </div>
</template>

<script setup lang="ts">
import ShaderAnimation from '@/components/ui/ShaderAnimation.vue'
</script>

<template>
  <div class="flex flex-1">
    <div class="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
      <div class="flex gap-2">
        <div v-for="i in 4" :key="`first-array-${i}`" class="h-20 w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse"></div>
      </div>
      <div class="flex gap-2 flex-1">
        <div v-for="i in 2" :key="`second-array-${i}`" class="h-full w-full rounded-lg bg-gray-100 dark:bg-neutral-800 animate-pulse"></div>
      </div>
    </div>
  </div>
</template>

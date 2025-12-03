<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.color || 'gray'}`]"
        >
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div v-if="toast.description" class="toast-description">
              {{ toast.description }}
            </div>
          </div>
          <button @click="remove(toast.id)" class="toast-close">
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';

const { toasts, remove } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toast-green {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.toast-red {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.toast-blue {
  background: rgba(59, 130, 246, 0.9);
  color: white;
}

.toast-orange {
  background: rgba(249, 115, 22, 0.9);
  color: white;
}

.toast-gray {
  background: rgba(107, 114, 128, 0.9);
  color: white;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.25;
}

.toast-description {
  font-size: 0.75rem;
  opacity: 0.9;
  margin-top: 4px;
}

.toast-close {
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: bold;
  padding: 0;
  margin-left: 12px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

/* Toast animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>

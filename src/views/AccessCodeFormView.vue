<template>
  <div class="access-code-form-page">
    <div class="access-code-form-bg">
      <ShaderAnimation playOnce />
    </div>

    <div class="access-code-form-overlay">
      <div class="access-code-form-card card">
        <h1>Access Code Form</h1>
        <p class="text-secondary">Form for access code: {{ accessCode }}</p>
        
        <div class="form-placeholder">
          <div class="placeholder-content">
            <h2>Form Content Coming Soon</h2>
            <p class="text-secondary">
              This form will be customized based on the access code you entered.
            </p>
            <div class="access-code-info">
              <span class="label">Access Code:</span>
              <span class="access-code-display">{{ accessCode }}</span>
            </div>
          </div>
          
          <div class="form-actions">
            <GradientButton @click="goBack">
              Back to Login
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import GradientButton from '@/components/ui/GradientButton.vue';
import ShaderAnimation from '@/components/ui/ShaderAnimation.vue';

const router = useRouter();
const route = useRoute();

const accessCode = ref('');

onMounted(() => {
  // Get the access code from route params
  accessCode.value = route.params.code as string;
  
  // If no access code is provided, redirect to login
  if (!accessCode.value) {
    router.push('/login');
  }
});

const goBack = () => {
  router.push('/login');
};
</script>

<style scoped>
.access-code-form-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

.access-code-form-bg {
  position: absolute;
  inset: 0;
}

.access-code-form-overlay {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.access-code-form-card {
  width: 100%;
  max-width: 600px;
  text-align: center;
  background: rgba(3, 33, 140, 0.66);
  border-radius: 12px;
  padding: 2.5rem;
  opacity: 0;
  animation: formFadeIn 0.9s ease-out forwards;
}

@keyframes formFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.access-code-form-card h1 {
  margin-bottom: 0.5rem;
  color: var(--title-primary);
}

.form-placeholder {
  margin-top: 2rem;
}

.placeholder-content {
  padding: 3rem 2rem;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  margin-bottom: 2rem;
}

.placeholder-content h2 {
  color: var(--title-primary);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.access-code-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.access-code-display {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  font-size: 1.2rem;
  color: var(--primary);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
</style>

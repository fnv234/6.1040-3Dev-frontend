<template>
  <div class="login-page">
    <div class="login-shader-bg">
      <ShaderAnimation playOnce />
    </div>

    <div class="login-overlay">
      <div class="login-card card">
        <h1>360 Feedback Admin</h1>
        <p class="text-secondary">HR Administration Portal</p>
        
        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label class="label" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="input"
              placeholder="admin@company.com"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="input"
              placeholder="••••••••"
              required
            />
          </div>
          
          <p v-if="error" class="text-error">{{ error }}</p>
          
          <GradientButton type="submit" :disabled="loading">
            {{ loading ? (mode === 'login' ? 'Logging in...' : 'Creating account...') : (mode === 'login' ? 'Login' : 'Create Account') }}
          </GradientButton>
        </form>
        
        <div class="demo-info">
          <p class="text-secondary">
            <small>
              {{ mode === 'login' ? 'Need an account?' : 'Already have an account?' }}
              <button type="button" class="link-button" @click="toggleMode">
                {{ mode === 'login' ? 'Create one here' : 'Log in instead' }}
              </button>
            </small>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import GradientButton from '@/components/ui/GradientButton.vue';
import ShaderAnimation from '@/components/ui/ShaderAnimation.vue';

const router = useRouter();

const auth = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const mode = ref<'login' | 'signup'>('login');

const toggleMode = () => {
  error.value = '';
  mode.value = mode.value === 'login' ? 'signup' : 'login';
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    if (mode.value === 'signup') {
      // Register creates the account and automatically logs in
      await auth.register(email.value, password.value);
    } else {
      await auth.login(email.value, password.value);
    }

    router.push('/dashboard');
  } catch (e: any) {
    error.value = e.message || 'A login error occurred. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

.login-shader-bg {
  position: absolute;
  inset: 0;
}

.login-overlay {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 420px;
  text-align: center;
  background: rgba(43, 42, 42, 0.92);
  border-radius: 12px;
  padding: 2.5rem;
  opacity: 0;
  animation: loginFadeIn 0.9s ease-out forwards;
}

@keyframes loginFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-card h1 {
  margin-bottom: 0.5rem;
  color: var(--title-primary);
}

.login-form {
  margin-top: 2rem;
  text-align: left;
}

.login-form .btn {
  width: 100%;
  margin-top: 0.5rem;
}

.demo-info {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.link-button {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  transition: color 0.2s;
}

.link-button:hover {
  color: var(--primary-hover);
}
</style>

<template>
  <div class="login-container">
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
        
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? (mode === 'login' ? 'Logging in...' : 'Creating account...') : (mode === 'login' ? 'Login' : 'Create Account') }}
        </button>
      </form>
      
      <div class="demo-info">
        <p class="text-secondary"><small>
          {{ mode === 'login' ? 'Need an account?' : 'Already have an account?' }}
          <button type="button" class="link-button" @click="toggleMode">
            {{ mode === 'login' ? 'Create one here' : 'Log in instead' }}
          </button>
        </small></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// dont want to use userDirectory concept?? change later
import { userDirectory } from '@/api/client';
import { useAuthStore } from '@/store/auth';

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
      const admin = auth.register(email.value, password.value);
      // Optionally register user in backend
      try {
        await userDirectory.register({
          userId: admin.id,
          displayName: admin.displayName,
          email: admin.email
        });
      } catch {
        // Ignore backend registration errors in demo
      }
      auth.login(email.value, password.value);
    } else {
      auth.login(email.value, password.value);
    }

    router.push('/dashboard');
  } catch (e: any) {
    error.value = e.message || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
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

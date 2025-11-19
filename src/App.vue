<template>
  <div id="app">
    <nav v-if="isAuthenticated" class="navbar">
      <div class="navbar-content">
        <router-link to="/dashboard" class="navbar-title-link">
          <h1 class="navbar-title">360 Feedback Admin</h1>
        </router-link>
        <div class="navbar-links">
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          <router-link to="/teams" class="nav-link">Teams</router-link>
          <router-link to="/forms/new" class="nav-link">Create Form</router-link>
          <button @click="handleLogout" class="btn btn-secondary">Logout</button>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const auth = useAuthStore();

const isAuthenticated = computed(() => auth.isAuthenticated.value);

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  background: white;
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  margin-bottom: 2rem;
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-title-link {
  text-decoration: none;
}

.navbar-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0;
}

.navbar-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--text);
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary);
}
</style>

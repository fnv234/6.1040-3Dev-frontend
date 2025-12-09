<template>
  <div id="app">
    <nav v-if="showNavbar" ref="navbarRef" class="navbar">
      <div class="navbar-content">
        <router-link to="/dashboard" class="navbar-title-link">
          <h1 class="navbar-title">360 Feedback Admin</h1>
        </router-link>
        <div class="navbar-links">
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          <router-link to="/teams" class="nav-link">Teams</router-link>
          <router-link to="/forms" class="nav-link">My Forms</router-link>
          <router-link to="/forms/new" class="nav-link">Create Form</router-link>
          <router-link to="/responses" class="nav-link">Responses</router-link>
          <GradientButton @click="handleLogout" variant="variant">Logout</GradientButton>
        </div>
      </div>
    </nav>
    <div ref="contentRef">
      <router-view />
    </div>
    <ToastDisplay />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth';
import GradientButton from '@/components/ui/GradientButton.vue';
import ToastDisplay from '@/components/ui/ToastDisplay.vue';
import { fadeIn, slideInLeft } from '@/utils/animations';

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const isAuthenticated = computed(() => auth.isAuthenticated.value)
const showNavbar = computed(() => isAuthenticated.value && route.name !== 'Login')

const navbarRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  if (navbarRef.value) {
    slideInLeft(navbarRef.value)
  }
  if (contentRef.value) {
    fadeIn(contentRef.value)
  }
})
</script>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  background: var(--gradient-1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.navbar-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--primary);
  background: rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  color: var(--primary);
  background: rgba(99, 102, 241, 0.15);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: var(--primary);
  border-radius: 2px;
}
</style>

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './store/auth';
import './style.css';

// Note: @nuxt/ui is designed for Nuxt 3, not standalone Vue apps
// For a Vite + Vue setup, you should use Headless UI + Tailwind directly
// Or consider using a Vue 3 compatible UI library like:
// - Element Plus
// - Naive UI  
// - PrimeVue
// - Vuetify

// For now, we'll use the existing setup with custom components
// If you want to use Nuxt UI components, you'll need to extract
// the individual components or migrate to Nuxt 3

const app = createApp(App);

app.use(router);

// Initialize auth store to ensure localStorage data is loaded
// This ensures authentication state persists across page refreshes
const authStore = useAuthStore();
// Access currentAdmin to trigger the localStorage loading
console.log('Auth initialized, current admin:', authStore.currentAdmin.value);

app.mount('#app');
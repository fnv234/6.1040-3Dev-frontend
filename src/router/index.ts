import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import TeamsView from '@/views/TeamsView.vue';
import FormBuilderView from '@/views/FormBuilderView.vue';
import MyFormsView from '@/views/MyFormsView.vue';
import AccessCodeFormView from '@/views/AccessCodeFormView.vue';
import FormResponsesView from '@/views/FormResponsesView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/teams',
    name: 'Teams',
    component: TeamsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/forms',
    name: 'MyForms',
    component: MyFormsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/forms/new',
    name: 'FormBuilder',
    component: FormBuilderView,
    meta: { requiresAuth: true }
  },
  {
    path: '/access-form/:code',
    name: 'AccessCodeForm',
    component: AccessCodeFormView
  },
  {
    path: '/responses',
    name: 'FormResponses',
    component: FormResponsesView,
    meta: { requiresAuth: true }
  },

  // Gradient button demo route removed (component no longer exists)
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Simple auth guard (expand with real token validation)
router.beforeEach((to, _from, next) => {
  // Check if user is authenticated by verifying session-specific localStorage data exists and is valid
  const getSessionKey = (baseKey: string) => {
    const sessionId = sessionStorage.getItem('hrSessionId');
    return sessionId ? `${baseKey}_${sessionId}` : baseKey;
  };
  
  const adminData = localStorage.getItem(getSessionKey('hrCurrentAdmin'));
  let isAuthenticated = false;
  
  if (adminData) {
    try {
      const parsed = JSON.parse(adminData);
      isAuthenticated = parsed && parsed._id && parsed.email;
    } catch {
      // Invalid data in localStorage, clear it
      localStorage.removeItem(getSessionKey('hrCurrentAdmin'));
      localStorage.removeItem(getSessionKey('hrAdminId'));
      localStorage.removeItem(getSessionKey('hrAdminEmail'));
    }
  }
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    // If already authenticated and trying to access login, redirect to dashboard
    next('/dashboard');
  } else {
    next();
  }
});

export default router;

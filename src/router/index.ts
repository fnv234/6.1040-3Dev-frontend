import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import TeamsView from '@/views/TeamsView.vue';
import FormBuilderView from '@/views/FormBuilderView.vue';
import MyFormsView from '@/views/MyFormsView.vue';
import FormAnswerView from '@/views/FormAnswerView.vue';
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
    path: '/form/:id',
    name: 'FormAnswer',
    component: FormAnswerView
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
  const isAuthenticated = localStorage.getItem('hrCurrentAdmin');
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;

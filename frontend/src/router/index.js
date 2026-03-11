import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import LoginPage from '../pages/LoginPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterPage,
    meta: { public: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../pages/DashboardPage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  if (to.meta.public && authStore.isAuthenticated) {
    return { name: 'dashboard' };
  }
});

export default router;
